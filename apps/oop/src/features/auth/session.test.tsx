import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from './authStore';
import { useCurrentUserQuery } from './queries/useCurrentUserQuery';
import { useLoginMutation } from './queries/useLoginMutation';
import { restoreSession } from './restoreSession';

import { demoAdminCredentials, demoCredentials } from '~/mocks/data/users';
import { adminProfileHandlers } from '~/mocks/handlers/adminProfile';
import { authHandlers, resetDemoPasswordState } from '~/mocks/handlers/auth';
import { studentHomeHandlers } from '~/mocks/handlers/studentHome';

const server = setupServer(
  ...authHandlers,
  ...adminProfileHandlers,
  ...studentHomeHandlers,
);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  resetDemoPasswordState();
  useAuthStore.getState().clearSession();
  clients.splice(0).forEach(client => client.clear());
  vi.unstubAllEnvs();
});
function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return {
    client,
    Wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

describe('cookie authentication bootstrap', () => {
  it.each([
    ['ADMIN', 'ADMIN', 'PROFESSOR'],
    ['USER', 'STUDENT', 'STUDENT'],
    ['USER', 'ASSISTANT', 'ASSISTANT'],
  ])(
    '/me %s와 로그인 %s는 %s 세션으로 진입한다',
    async (globalRole, role, expectedRole) => {
      vi.stubEnv('VITE_ENABLE_MSW', 'false');
      server.use(
        http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, () =>
          HttpResponse.json({ message: 'ok', role }),
        ),
        http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
          HttpResponse.json({
            studentNumber: 'review-user',
            name: 'Review',
            email: 'review@example.com',
            phone: '',
            globalRole,
          }),
        ),
      );
      const { Wrapper } = wrapper();
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: Wrapper,
      });
      await act(async () => {
        await result.current.mutateAsync(demoCredentials);
      });
      expect(useAuthStore.getState().currentUser?.globalRole).toBe(
        expectedRole,
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    },
  );

  it.each([
    ['USER', 'ADMIN'],
    ['ADMIN', 'STUDENT'],
    ['ADMIN', 'ASSISTANT'],
    ['UNKNOWN', 'STUDENT'],
  ])(
    '/me %s와 로그인 %s가 모순되면 세션과 이전 캐시를 제거한다',
    async (globalRole, role) => {
      server.use(
        http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, () =>
          HttpResponse.json({ message: 'ok', role }),
        ),
        http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
          HttpResponse.json({ studentNumber: 'review-user', globalRole }),
        ),
      );
      const { Wrapper, client } = wrapper();
      client.setQueryData(['previous-account'], { private: true });
      const { result } = renderHook(() => useLoginMutation(), {
        wrapper: Wrapper,
      });
      await act(async () => {
        await expect(
          result.current.mutateAsync(demoCredentials),
        ).rejects.toThrow('일치하지');
      });
      expect(useAuthStore.getState()).toMatchObject({
        isAuthenticated: false,
        currentUser: null,
        sessionRole: null,
      });
      expect(client.getQueryData(['previous-account'])).toBeUndefined();
    },
  );

  it('refresh와 /me의 역할이 모순되면 세션을 복원하지 않는다', async () => {
    useAuthStore.getState().markAuthenticated('ADMIN');
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`, () =>
        HttpResponse.json({ message: 'ok', role: 'ADMIN' }),
      ),
      http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
        HttpResponse.json({ globalRole: 'USER' }),
      ),
    );
    await restoreSession();
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      currentUser: null,
      sessionRole: null,
    });
  });

  it('로그인은 body token 없이 학생 세션을 설정하고 기존 mock 홈 조회를 허용한다', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'true');
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(demoCredentials);
    });
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      sessionRole: 'STUDENT',
      accessToken: null,
    });
    const response = await fetch(
      `${API_BASE_URL}/sections/oop-2026-2-01/dashboard/student`,
    );
    expect(response.status).toBe(200);
  });

  it('조교는 /me 재조회와 refresh 뒤에도 역할을 유지하며 운영자 mock을 조회한다', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'true');
    const { Wrapper } = wrapper();
    const { result } = renderHook(
      () => ({ login: useLoginMutation(), me: useCurrentUserQuery() }),
      { wrapper: Wrapper },
    );
    await act(async () => {
      await result.current.login.mutateAsync(demoAdminCredentials);
    });
    await act(async () => {
      await result.current.me.refetch();
    });
    expect(result.current.me.data?.globalRole).toBe('ASSISTANT');
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.PROFILE.ME}`);
    expect(response.status).toBe(200);
    await act(async () => {
      await restoreSession();
    });
    expect(useAuthStore.getState().currentUser?.globalRole).toBe('ASSISTANT');
  });

  it('로그인 뒤 /me가 실패하면 이전 계정의 세션과 캐시를 남기지 않는다', async () => {
    const { Wrapper, client } = wrapper();
    client.setQueryData(['private'], { name: 'previous user' });
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.USER.ME}`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await expect(
        result.current.mutateAsync(demoCredentials),
      ).rejects.toBeDefined();
    });
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      currentUser: null,
      sessionRole: null,
    });
    expect(client.getQueryData(['private'])).toBeUndefined();
  });

  it('역할 없는 로그인 응답과 잘못된 비밀번호를 거부한다', async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await expect(
        result.current.mutateAsync({
          ...demoCredentials,
          password: 'incorrect',
        }),
      ).rejects.toBeDefined();
    });
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGIN}`, () =>
        HttpResponse.json({ message: 'ok' }),
      ),
    );
    await act(async () => {
      await expect(result.current.mutateAsync(demoCredentials)).rejects.toThrow(
        '역할',
      );
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('실서버 응답에 없는 팀 이름이나 소속 분반을 생성하지 않는다', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'false');
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(demoCredentials);
    });
    expect(useAuthStore.getState().currentUser).toMatchObject({
      teamId: '7',
      currentTeam: null,
    });
  });

  it('세션이나 역할이 없으면 /me query를 실행하지 않는다', async () => {
    let calls = 0;
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () => {
        calls += 1;
        return new HttpResponse(null, { status: 401 });
      }),
    );
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCurrentUserQuery(), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(calls).toBe(0);
  });

  it('refresh가 실패하면 이전 세션을 제거한다', async () => {
    useAuthStore.getState().markAuthenticated('ASSISTANT');
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
        () => new HttpResponse(null, { status: 401 }),
      ),
    );
    await restoreSession();
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      currentUser: null,
      sessionRole: null,
    });
  });
});
