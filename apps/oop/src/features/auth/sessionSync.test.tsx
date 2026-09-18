import { API_BASE_URL, ENDPOINTS, apiClient } from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { useAuthStore } from './authStore';
import { broadcastLogout, startSessionSync } from './sessionSync';

import { demoAdmin } from '~/mocks/data/users';

const server = setupServer();
let stop = () => {};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  stop();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function signIn() {
  useAuthStore.getState().setCurrentUser(demoAdmin);
  useAuthStore.getState().markAuthenticated('ADMIN');
}

it('일반 API 401 응답이 오면 세션을 만료 사유와 함께 정리한다', async () => {
  server.use(
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

it('다른 탭의 로그아웃 이벤트를 받으면 세션을 정리한다', () => {
  signIn();
  stop = startSessionSync();

  window.dispatchEvent(
    new StorageEvent('storage', {
      key: 'aics:auth-event',
      newValue: JSON.stringify({ at: Date.now(), type: 'logout' }),
    }),
  );

  expect(useAuthStore.getState().sessionEndReason).toBe(
    'signed-out-elsewhere',
  );
  expect(useAuthStore.getState().currentUser).toBeNull();
});

it('로그아웃 브로드캐스트는 저장소에 흔적을 남기지 않는다', () => {
  broadcastLogout();
  expect(localStorage.getItem('aics:auth-event')).toBeNull();
});
