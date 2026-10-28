import {
  API_BASE_URL,
  ENDPOINTS,
  apiClient,
  submitLogin,
  submitLogout,
  submitRefresh,
  updateUserPassword,
} from '@aics/api-client';
import { isAxiosError, isCancel } from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from './authStore';
import { startSessionSync } from './sessionSync';
import { createAppQueryClient } from '../../app/providers/query-provider';

const server = setupServer();
const resource = '/session-recovery-test';
let stop = () => {};
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
const ok = () => HttpResponse.json({ message: 'ok', role: 'STUDENT' });
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  useAuthStore.getState().clearSession();
  localStorage.removeItem('aics:session-recovery');
  useAuthStore.getState().markAuthenticated('STUDENT');
  stop = startSessionSync();
});
afterEach(() => {
  stop();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  localStorage.removeItem('aics:session-recovery');
});

it('동시 10개 401은 한 번 갱신하고 각 요청을 한 번 재전송한다', async () => {
  let requests = 0;
  let refreshes = 0;
  let refreshed = false;
  const allArrived = deferred();
  server.use(
    http.get(`${API_BASE_URL}${resource}`, async () => {
      requests += 1;
      if (refreshed) return HttpResponse.json({ ok: true });
      if (requests === 10) allArrived.resolve();
      await allArrived.promise;
      return new HttpResponse(null, { status: 401 });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () => {
      refreshes += 1;
      refreshed = true;
      return ok();
    }),
  );
  const responses = await Promise.all(
    Array.from({ length: 10 }, () => apiClient.get(resource)),
  );
  expect(responses.every(response => response.data.ok)).toBe(true);
  expect(refreshes).toBe(1);
  expect(requests).toBe(20);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

it('갱신 성공 후 도착한 이전 세대의 401은 추가 갱신 없이 재전송한다', async () => {
  const arrived = deferred();
  const release = deferred();
  let refreshes = 0;
  let slowRequests = 0;
  server.use(
    http.get(`${API_BASE_URL}${resource}/slow`, async () => {
      slowRequests += 1;
      if (slowRequests > 1) return HttpResponse.json({ ok: true });
      arrived.resolve();
      await release.promise;
      return new HttpResponse(null, { status: 401 });
    }),
    http.get(`${API_BASE_URL}${resource}`, () =>
      refreshes
        ? HttpResponse.json({ ok: true })
        : new HttpResponse(null, { status: 401 }),
    ),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () => {
      refreshes += 1;
      return ok();
    }),
  );
  const slow = apiClient.get(`${resource}/slow`);
  await arrived.promise;
  await apiClient.get(resource);
  release.resolve();
  await slow;
  expect(refreshes).toBe(1);
  expect(slowRequests).toBe(2);
});

it('재전송도 401이면 더 갱신하지 않고 세션을 종료한다', async () => {
  let refreshes = 0;
  let requests = 0;
  server.use(
    http.get(`${API_BASE_URL}${resource}`, () => {
      requests += 1;
      return new HttpResponse(null, { status: 401 });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () => {
      refreshes += 1;
      return ok();
    }),
  );
  await expect(apiClient.get(resource)).rejects.toBeDefined();
  expect(refreshes).toBe(1);
  expect(requests).toBe(2);
  expect(useAuthStore.getState().sessionEndReason).toBe('expired');
});

it.each([503, 'network'] as const)(
  'refresh %s는 세션을 유지하고 후속 요청에서 회전을 반복하지 않는다',
  async status => {
    let refreshes = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${resource}`,
        () => new HttpResponse(null, { status: 401 }),
      ),
      http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () => {
        refreshes += 1;
        return status === 'network'
          ? HttpResponse.error()
          : new HttpResponse(null, { status });
      }),
    );
    await expect(apiClient.get(resource)).rejects.toThrow('세션 갱신');
    await expect(apiClient.get(resource)).rejects.toThrow('세션 갱신');
    expect(refreshes).toBe(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  },
);

it('복원 직후 다른 탭이 같은 쿠키 세대에 기록한 실패를 로컬 활성화가 지우지 않는다', async () => {
  let resourceRequests = 0;
  let refreshes = 0;
  server.use(
    http.get(`${API_BASE_URL}${resource}/restore-race`, () => {
      resourceRequests += 1;
      return new HttpResponse(null, { status: 401 });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () => {
      refreshes += 1;
      return ok();
    }),
  );

  useAuthStore.getState().clearSession();
  await submitRefresh();
  const committed = JSON.parse(
    localStorage.getItem('aics:session-recovery') ?? 'null',
  ) as { session: string; revision: string };
  const sharedFailure = {
    ...committed,
    failed: {
      reason: 'unavailable',
      session: committed.session,
      revision: committed.revision,
    },
  };
  // Deterministically model the storage value written by a sibling tab after
  // restore refresh released the Web Lock but before this tab commits auth UI.
  localStorage.setItem('aics:session-recovery', JSON.stringify(sharedFailure));
  useAuthStore.getState().markAuthenticated('STUDENT');

  await expect(apiClient.get(`${resource}/restore-race`)).rejects.toThrow(
    '세션 갱신',
  );
  expect(refreshes).toBe(1);
  expect(resourceRequests).toBe(0);
  expect(
    JSON.parse(localStorage.getItem('aics:session-recovery') ?? 'null'),
  ).toEqual(sharedFailure);
});

it('현재 쿠키 세대와 소유권이 다른 실패 표시는 갱신을 막지 않는다', async () => {
  let requests = 0;
  let refreshes = 0;
  localStorage.setItem(
    'aics:session-recovery',
    JSON.stringify({
      session: 'current-session',
      revision: 'current-revision',
      failed: {
        reason: 'unavailable',
        session: 'older-session',
        revision: 'older-revision',
      },
    }),
  );
  server.use(
    http.get(`${API_BASE_URL}${resource}/owned-failure`, () => {
      requests += 1;
      return requests === 1
        ? new HttpResponse(null, { status: 401 })
        : HttpResponse.json({ ok: true });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () => {
      refreshes += 1;
      return ok();
    }),
  );

  await expect(
    apiClient.get(`${resource}/owned-failure`),
  ).resolves.toMatchObject({ data: { ok: true } });
  expect(refreshes).toBe(1);
  expect(requests).toBe(2);
  expect(
    JSON.parse(localStorage.getItem('aics:session-recovery') ?? 'null'),
  ).not.toHaveProperty('failed');
});

it('갱신 중 로그아웃은 쿠키 갱신이 끝난 뒤 실행하고 원요청을 재생하지 않는다', async () => {
  const started = deferred();
  const release = deferred();
  const order: string[] = [];
  let requests = 0;
  server.use(
    http.get(`${API_BASE_URL}${resource}`, () => {
      requests += 1;
      return new HttpResponse(null, { status: 401 });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      started.resolve();
      await release.promise;
      order.push('refresh');
      return ok();
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, () => {
      order.push('logout');
      return ok();
    }),
  );
  const request = apiClient.get(resource).catch(error => error);
  await started.promise;
  const logout = submitLogout();
  release.resolve();
  await logout;
  expect(isCancel(await request)).toBe(true);
  expect(order).toEqual(['refresh', 'logout']);
  expect(requests).toBe(1);
});

it('세션 복원과 사용 중 갱신이 겹쳐도 refresh를 공유한다', async () => {
  const started = deferred();
  const release = deferred();
  let refreshes = 0;
  server.use(
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      refreshes += 1;
      started.resolve();
      await release.promise;
      return ok();
    }),
  );
  const first = submitRefresh();
  await started.promise;
  const second = submitRefresh();
  release.resolve();
  await Promise.all([first, second]);
  expect(refreshes).toBe(1);
});

it('갱신 중 시작한 인증 요청은 갱신 완료 전 네트워크로 보내지 않는다', async () => {
  const refreshStarted = deferred();
  const releaseRefresh = deferred();
  let firstRequests = 0;
  let laterRequests = 0;
  let refreshed = false;
  server.use(
    http.get(`${API_BASE_URL}${resource}/first`, () => {
      firstRequests += 1;
      return refreshed
        ? HttpResponse.json({ ok: true })
        : new HttpResponse(null, { status: 401 });
    }),
    http.get(`${API_BASE_URL}${resource}/later`, () => {
      laterRequests += 1;
      return HttpResponse.json({ ok: true });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      refreshStarted.resolve();
      await releaseRefresh.promise;
      refreshed = true;
      return ok();
    }),
  );

  const first = apiClient.get(`${resource}/first`);
  await refreshStarted.promise;
  const later = apiClient.get(`${resource}/later`);
  await Promise.resolve();
  expect(laterRequests).toBe(0);

  releaseRefresh.resolve();
  await Promise.all([first, later]);
  expect(firstRequests).toBe(2);
  expect(laterRequests).toBe(1);
});

it('갱신 중 비밀번호 검증 요청은 완료 전 dispatch하지 않고 이후 전송한다', async () => {
  const refreshStarted = deferred();
  const releaseRefresh = deferred();
  let passwordRequests = 0;
  let refreshed = false;
  server.use(
    http.get(`${API_BASE_URL}${resource}/start-password-wait`, () =>
      refreshed
        ? HttpResponse.json({ ok: true })
        : new HttpResponse(null, { status: 401 }),
    ),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      refreshStarted.resolve();
      await releaseRefresh.promise;
      refreshed = true;
      return ok();
    }),
    http.put(
      `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD('student-1')}`,
      () => {
        passwordRequests += 1;
        return HttpResponse.text('updated');
      },
    ),
  );

  const triggeringRequest = apiClient.get(`${resource}/start-password-wait`);
  await refreshStarted.promise;
  const passwordUpdate = updateUserPassword({
    studentNumber: 'student-1',
    currentPassword: 'current',
    password: 'next',
  });
  await Promise.resolve();
  expect(passwordRequests).toBe(0);

  releaseRefresh.resolve();
  await expect(passwordUpdate).resolves.toBe('updated');
  await triggeringRequest;
  expect(passwordRequests).toBe(1);
});

it('갱신 대기 중 취소된 자격 증명 검증 요청은 dispatch하지 않는다', async () => {
  const refreshStarted = deferred();
  const releaseRefresh = deferred();
  let validationRequests = 0;
  let refreshed = false;
  server.use(
    http.get(`${API_BASE_URL}${resource}/start-abort-wait`, () =>
      refreshed
        ? HttpResponse.json({ ok: true })
        : new HttpResponse(null, { status: 401 }),
    ),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      refreshStarted.resolve();
      await releaseRefresh.promise;
      refreshed = true;
      return ok();
    }),
    http.put(`${API_BASE_URL}${resource}/credential-abort`, () => {
      validationRequests += 1;
      return HttpResponse.json({ ok: true });
    }),
  );

  const triggeringRequest = apiClient.get(`${resource}/start-abort-wait`);
  await refreshStarted.promise;
  const controller = new AbortController();
  const validation = apiClient
    .put(
      `${resource}/credential-abort`,
      {},
      { skipSessionRecovery: true, signal: controller.signal },
    )
    .catch(error => error);
  controller.abort();
  expect(isCancel(await validation)).toBe(true);
  expect(validationRequests).toBe(0);

  releaseRefresh.resolve();
  await triggeringRequest;
  expect(validationRequests).toBe(0);
});

it('갱신 대기 중 무효화된 자격 증명 검증 요청은 dispatch하지 않는다', async () => {
  const refreshStarted = deferred();
  const releaseRefresh = deferred();
  let validationRequests = 0;
  server.use(
    http.get(
      `${API_BASE_URL}${resource}/start-stale-wait`,
      () => new HttpResponse(null, { status: 401 }),
    ),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      refreshStarted.resolve();
      await releaseRefresh.promise;
      return ok();
    }),
    http.put(`${API_BASE_URL}${resource}/credential-stale`, () => {
      validationRequests += 1;
      return HttpResponse.json({ ok: true });
    }),
  );

  const triggeringRequest = apiClient
    .get(`${resource}/start-stale-wait`)
    .catch(error => error);
  await refreshStarted.promise;
  const validation = apiClient
    .put(`${resource}/credential-stale`, {}, { skipSessionRecovery: true })
    .catch(error => error);
  // Let the interceptor capture this session before making it stale.
  await Promise.resolve();
  useAuthStore.getState().clearSession();
  releaseRefresh.resolve();

  expect(isCancel(await validation)).toBe(true);
  expect(isCancel(await triggeringRequest)).toBe(true);
  expect(validationRequests).toBe(0);
});

it('취소된 원요청은 공유 갱신이 성공해도 재전송하지 않는다', async () => {
  const started = deferred();
  const release = deferred();
  let requests = 0;
  server.use(
    http.get(`${API_BASE_URL}${resource}`, () => {
      requests += 1;
      return new HttpResponse(null, { status: 401 });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, async () => {
      started.resolve();
      await release.promise;
      return ok();
    }),
  );
  const controller = new AbortController();
  const request = apiClient
    .get(resource, { signal: controller.signal })
    .catch(error => error);
  await started.promise;
  controller.abort();
  release.resolve();
  expect(isCancel(await request)).toBe(true);
  expect(requests).toBe(1);
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

it('자격 증명 검증 응답은 계정 전환 중 완료되면 취소한다', async () => {
  const validationStarted = deferred();
  const releaseValidation = deferred();
  server.use(
    http.put(`${API_BASE_URL}${resource}/credential`, async () => {
      validationStarted.resolve();
      await releaseValidation.promise;
      return HttpResponse.json({ ok: true });
    }),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, () => ok()),
  );

  const validation = apiClient
    .put(`${resource}/credential`, {}, { skipSessionRecovery: true })
    .catch(error => error);
  await validationStarted.promise;
  await submitLogin({ studentNumber: 'other', password: 'test' });
  releaseValidation.resolve();

  expect(isCancel(await validation)).toBe(true);
});

it('일반 403과 폼 자격 증명 401은 갱신하거나 세션을 종료하지 않는다', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}${resource}`,
      () => new HttpResponse(null, { status: 403 }),
    ),
    http.put(
      `${API_BASE_URL}${resource}`,
      () => new HttpResponse(null, { status: 401 }),
    ),
  );
  await expect(apiClient.get(resource)).rejects.toMatchObject({
    response: { status: 403 },
  });
  await expect(
    apiClient.put(resource, {}, { skipSessionRecovery: true }),
  ).rejects.toMatchObject({ response: { status: 401 } });
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});

it('최종 refresh 401은 Axios 오류 모양을 유지하고 Query가 업무 요청을 재시도하지 않는다', async () => {
  let requests = 0;
  server.use(
    http.get(`${API_BASE_URL}${resource}/query`, () => {
      requests += 1;
      return new HttpResponse(null, { status: 401 });
    }),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
      () => new HttpResponse(null, { status: 401 }),
    ),
  );
  const queryClient = createAppQueryClient();

  const error = await queryClient
    .fetchQuery({
      queryKey: ['session-expiry-query'],
      queryFn: () => apiClient.get(`${resource}/query`),
    })
    .catch(error => error);

  expect(isAxiosError(error)).toBe(true);
  expect(error).toMatchObject({ response: { status: 401 } });
  expect(requests).toBe(1);
  queryClient.clear();
});

it('서버 응답에 토큰 필드가 추가되어도 탭 공유 저장소에는 저장하지 않는다', async () => {
  server.use(
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () =>
      HttpResponse.json({
        message: 'ok',
        role: 'STUDENT',
        refreshToken: 'must-not-persist',
        accessToken: 'also-private',
      }),
    ),
  );
  await submitRefresh();
  expect(localStorage.getItem('aics:session-recovery')).not.toContain(
    'must-not-persist',
  );
  expect(localStorage.getItem('aics:session-recovery')).not.toContain(
    'also-private',
  );
});

it.each([
  ['login', ENDPOINTS.AUTH.LOGIN],
  ['logout', ENDPOINTS.AUTH.LOGOUT],
] as const)(
  '실패한 %s은 다른 탭에 커밋된 세션 변경을 게시하지 않는다',
  async (kind, endpoint) => {
    server.use(http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, () => ok()));
    await submitLogin({ studentNumber: 'existing', password: 'test' });
    const before = JSON.parse(
      localStorage.getItem('aics:session-recovery') ?? 'null',
    ) as { session: string };
    server.use(
      http.post(`${API_BASE_URL}${endpoint}`, () =>
        HttpResponse.json(
          { code: `${kind.toUpperCase()}_FAILED` },
          { status: 403 },
        ),
      ),
    );

    const operation =
      kind === 'login'
        ? submitLogin({ studentNumber: 'next', password: 'wrong' })
        : submitLogout();
    await expect(operation).rejects.toMatchObject({
      response: { status: 403 },
    });

    const after = JSON.parse(
      localStorage.getItem('aics:session-recovery') ?? 'null',
    ) as { session: string };
    expect(after.session).toBe(before.session);
  },
);

it('성공한 로그인과 로그아웃은 각각 커밋된 세션 변경을 게시한다', async () => {
  server.use(
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, () => ok()),
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, () => ok()),
  );

  await submitLogin({ studentNumber: 'next', password: 'test' });
  const afterLogin = JSON.parse(
    localStorage.getItem('aics:session-recovery') ?? 'null',
  ) as { session: string };
  await submitLogout();
  const afterLogout = JSON.parse(
    localStorage.getItem('aics:session-recovery') ?? 'null',
  ) as { session: string };

  expect(afterLogin.session).toBeTruthy();
  expect(afterLogout.session).toBeTruthy();
  expect(afterLogout.session).not.toBe(afterLogin.session);
});

it('이전 로그인 실패가 새 로그인 요청을 덮어쓰지 않도록 취소로 반환한다', async () => {
  const started = deferred();
  const release = deferred();
  let logins = 0;
  server.use(
    http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, async () => {
      logins += 1;
      if (logins === 1) {
        started.resolve();
        await release.promise;
        return new HttpResponse(null, { status: 503 });
      }
      return ok();
    }),
  );
  const oldLogin = submitLogin({
    studentNumber: 'first',
    password: 'test',
  }).catch(error => error);
  await started.promise;
  const newLogin = submitLogin({ studentNumber: 'second', password: 'test' });
  release.resolve();
  expect(isCancel(await oldLogin)).toBe(true);
  await expect(newLogin).resolves.toMatchObject({ role: 'STUDENT' });
});
