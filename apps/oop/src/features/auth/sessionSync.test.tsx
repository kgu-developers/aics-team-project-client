import {
  API_BASE_URL,
  ENDPOINTS,
  apiClient,
  SessionRefreshError,
  submitLogin,
  submitLogout,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from './authStore';
import { broadcastLogout, startSessionSync } from './sessionSync';

import { demoAdmin } from '~/mocks/data/users';

const server = setupServer();
let stop = () => {};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  stop();
  server.resetHandlers();
  localStorage.removeItem('aics:session-recovery');
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function signIn() {
  useAuthStore.getState().setCurrentUser(demoAdmin);
  useAuthStore.getState().markAuthenticated('ADMIN');
}

it('일반 API와 refresh가 모두 401이면 세션을 만료 사유와 함께 정리한다', async () => {
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
      () => new HttpResponse(null, { status: 401 }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
    ),
  );
  signIn();
  stop = startSessionSync();

  await expect(apiClient.get(ENDPOINTS.USER.ME)).rejects.toBeDefined();

  const state = useAuthStore.getState();
  expect(state.isAuthenticated).toBe(false);
  expect(state.sessionEndReason).toBe('expired');
});

it('로그인·재발급 자체의 401은 세션 사유로 기록하지 않는다', async () => {
  server.use(
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () =>
      HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
    ),
  );
  signIn();
  stop = startSessionSync();

  await expect(apiClient.post(ENDPOINTS.AUTH.REFRESH)).rejects.toBeDefined();

  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

it('현재 세대의 로그아웃 이벤트만 한 번 적용한다', () => {
  const generation = { session: 'logout-generation', revision: '' };
  localStorage.setItem('aics:session-recovery', JSON.stringify(generation));
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);
  const event = new StorageEvent('storage', {
    key: 'aics:auth-event',
    newValue: JSON.stringify({ ...generation, at: Date.now(), type: 'logout' }),
  });

  window.dispatchEvent(event);
  window.dispatchEvent(event);

  expect(useAuthStore.getState().sessionEndReason).toBe('signed-out-elsewhere');
  expect(useAuthStore.getState().currentUser).toBeNull();
  expect(clearCache).toHaveBeenCalledOnce();
});

it('새 로그인 뒤 늦게 도착한 이전 로그아웃 이벤트는 무시한다', () => {
  localStorage.setItem(
    'aics:session-recovery',
    JSON.stringify({ session: 'new-login', revision: '' }),
  );
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'aics:session-recovery',
      oldValue: JSON.stringify({ session: 'before-old-logout', revision: '' }),
      newValue: JSON.stringify({ session: 'old-logout', revision: '' }),
    }),
  );
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'aics:auth-event',
      newValue: JSON.stringify({
        at: Date.now(),
        type: 'logout',
        session: 'old-logout',
        revision: '',
      }),
    }),
  );

  expect(useAuthStore.getState().currentUser).toEqual(demoAdmin);
  expect(clearCache).not.toHaveBeenCalled();
});

it('현재 세대의 sibling 만료를 한 번만 적용하고 캐시를 정리한다', () => {
  const previous = { session: 'account-a', revision: 'revision-a' };
  const expired = {
    ...previous,
    failed: { ...previous, reason: 'expired' },
  };
  localStorage.setItem('aics:session-recovery', JSON.stringify(previous));
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);
  localStorage.setItem('aics:session-recovery', JSON.stringify(expired));
  const event = new StorageEvent('storage', {
    key: 'aics:session-recovery',
    oldValue: JSON.stringify(previous),
    newValue: JSON.stringify(expired),
  });

  window.dispatchEvent(event);
  window.dispatchEvent(event);

  expect(useAuthStore.getState().sessionEndReason).toBe('expired');
  expect(useAuthStore.getState().currentUser).toBeNull();
  expect(clearCache).toHaveBeenCalledOnce();
});

it('현재 저장 세대와 다른 늦은 만료 이벤트는 새 로그인을 정리하지 않는다', () => {
  localStorage.setItem(
    'aics:session-recovery',
    JSON.stringify({ session: 'new-login', revision: 'new-revision' }),
  );
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);
  const stale = {
    session: 'old-login',
    revision: 'old-revision',
    failed: {
      reason: 'expired',
      session: 'old-login',
      revision: 'old-revision',
    },
  };

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'aics:session-recovery',
      oldValue: JSON.stringify({
        session: 'old-login',
        revision: 'old-revision',
      }),
      newValue: JSON.stringify(stale),
    }),
  );

  expect(useAuthStore.getState().currentUser).toEqual(demoAdmin);
  expect(clearCache).not.toHaveBeenCalled();
});

it('요청이 현재 세대의 기존 만료를 발견하면 네트워크 전 최종 만료로 알린다', async () => {
  const generation = { session: 'account-a', revision: 'revision-a' };
  localStorage.setItem(
    'aics:session-recovery',
    JSON.stringify({
      ...generation,
      failed: { ...generation, reason: 'expired' },
    }),
  );
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);
  let requests = 0;
  server.use(
    http.get(API_BASE_URL + ENDPOINTS.USER.ME, () => {
      requests += 1;
      return HttpResponse.json(demoAdmin);
    }),
  );

  await expect(apiClient.get(ENDPOINTS.USER.ME)).rejects.toBeInstanceOf(
    SessionRefreshError,
  );

  expect(requests).toBe(0);
  expect(useAuthStore.getState().sessionEndReason).toBe('expired');
  expect(clearCache).toHaveBeenCalledOnce();
});

it('다른 탭의 직접 로그인·계정 전환은 사용자와 개인 캐시를 함께 정리한다', () => {
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);

  const next = { session: 'account-b', revision: '' };
  localStorage.setItem('aics:session-recovery', JSON.stringify(next));
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'aics:session-recovery',
      oldValue: JSON.stringify({ session: 'account-a', revision: '' }),
      newValue: JSON.stringify(next),
    }),
  );

  expect(useAuthStore.getState().sessionEndReason).toBe(
    'session-changed-elsewhere',
  );
  expect(useAuthStore.getState().currentUser).toBeNull();
  expect(clearCache).toHaveBeenCalledOnce();
});

it.each([
  ['login', ENDPOINTS.AUTH.LOGIN],
  ['logout', ENDPOINTS.AUTH.LOGOUT],
] as const)(
  '다른 탭의 실패한 %s은 현재 사용자와 캐시를 무효화하지 않는다',
  async (kind, endpoint) => {
    localStorage.setItem(
      'aics:session-recovery',
      JSON.stringify({ session: 'existing', revision: '' }),
    );
    signIn();
    const clearCache = vi.fn();
    stop = startSessionSync(clearCache);
    server.use(
      http.post(`${API_BASE_URL}${endpoint}`, () =>
        HttpResponse.json({ code: 'FAILED' }, { status: 403 }),
      ),
    );

    const operation =
      kind === 'login'
        ? submitLogin({ studentNumber: 'other', password: 'wrong' })
        : submitLogout();
    await expect(operation).rejects.toMatchObject({
      response: { status: 403 },
    });

    expect(useAuthStore.getState().currentUser).toEqual(demoAdmin);
    expect(clearCache).not.toHaveBeenCalled();
  },
);

it.each([
  ['login', ENDPOINTS.AUTH.LOGIN],
  ['logout', ENDPOINTS.AUTH.LOGOUT],
] as const)(
  '다른 탭의 성공한 %s 커밋은 현재 사용자와 캐시를 무효화한다',
  async (kind, endpoint) => {
    localStorage.setItem(
      'aics:session-recovery',
      JSON.stringify({ session: 'existing', revision: '' }),
    );
    signIn();
    const clearCache = vi.fn();
    stop = startSessionSync(clearCache);
    server.use(
      http.post(`${API_BASE_URL}${endpoint}`, () =>
        HttpResponse.json({ message: 'ok', role: 'STUDENT' }),
      ),
    );
    const originalSetItem = Storage.prototype.setItem;
    const publishToSibling = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(function (this: Storage, key, value) {
        const oldValue = this.getItem(key);
        originalSetItem.call(this, key, value);
        if (key === 'aics:session-recovery' && oldValue !== value) {
          window.dispatchEvent(
            new StorageEvent('storage', { key, oldValue, newValue: value }),
          );
        }
      });

    try {
      if (kind === 'login') {
        await submitLogin({ studentNumber: 'other', password: 'test' });
      } else {
        await submitLogout();
      }
    } finally {
      publishToSibling.mockRestore();
    }

    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(clearCache).toHaveBeenCalledOnce();
  },
);

it('같은 세션의 refresh 세대 변경은 사용자와 캐시를 정리하지 않는다', () => {
  signIn();
  const clearCache = vi.fn();
  stop = startSessionSync(clearCache);

  const next = { session: 'account-a', revision: 'new' };
  localStorage.setItem('aics:session-recovery', JSON.stringify(next));
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'aics:session-recovery',
      oldValue: JSON.stringify({ session: 'account-a', revision: 'old' }),
      newValue: JSON.stringify(next),
    }),
  );

  expect(useAuthStore.getState().currentUser).toEqual(demoAdmin);
  expect(clearCache).not.toHaveBeenCalled();
});

it('로그아웃 브로드캐스트는 저장소에 흔적을 남기지 않는다', () => {
  broadcastLogout({ session: 'committed-logout', revision: '' });
  expect(localStorage.getItem('aics:auth-event')).toBeNull();
});
