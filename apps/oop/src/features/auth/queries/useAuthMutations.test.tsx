import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  demoAccessToken,
  demoCredentials,
  demoStudent,
} from '../../../mocks/data/users';
import {
  authHandlers,
  resetDemoPasswordState,
} from '../../../mocks/handlers/auth';
import { useAuthStore } from '../authStore';
import { useLogoutMutation } from './useLogoutMutation';
import { useUpdateMyPasswordMutation } from './useUpdateMyPasswordMutation';

const server = setupServer(...authHandlers);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  queryClients.splice(0).forEach(client => client.clear());
  resetDemoPasswordState();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClients.push(client);
  return client;
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('auth mutations', () => {
  it('비밀번호 변경을 실제 학번 path와 password body로 요청하고 세션을 정리한다', async () => {
    let receivedBody: unknown;
    let receivedStudentNumber: string | readonly string[] | undefined;
    server.use(
      http.put(
        `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD(':studentNumber')}`,
        async ({ params, request }) => {
          receivedStudentNumber = params.studentNumber;
          receivedBody = await request.json();
          return HttpResponse.text('Password changed successfully');
        },
      ),
    );
    useAuthStore.getState().markAuthenticated('STUDENT');
    useAuthStore.getState().setCurrentUser(demoStudent);
    const queryClient = createQueryClient();
    queryClient.setQueryData(['private-data'], { shouldNotSurvive: true });
    const { result } = renderHook(() => useUpdateMyPasswordMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          currentPassword: demoCredentials.password,
          newPassword: 'oop-new-password',
        }),
      ).resolves.toBe('Password changed successfully');
    });

    expect(receivedStudentNumber).toBe(demoStudent.studentNumber);
    expect(receivedBody).toEqual({
      currentPassword: demoCredentials.password,
      password: 'oop-new-password',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
  });

  it.each(['사용자 없음', '빈 학번', '공백 학번', '로그아웃 상태'])(
    '%s이면 비밀번호 변경 API를 호출하지 않는다',
    async condition => {
      let requests = 0;
      server.use(
        http.put(
          `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD(':studentNumber')}`,
          () => {
            requests += 1;
            return HttpResponse.text('unexpected');
          },
        ),
      );
      const state = useAuthStore.getState();
      state.markAuthenticated('STUDENT');
      if (condition !== '사용자 없음') {
        state.setCurrentUser({
          ...demoStudent,
          studentNumber:
            condition === '빈 학번'
              ? ''
              : condition === '공백 학번'
                ? '   '
                : demoStudent.studentNumber,
        });
      }
      const { result } = renderHook(() => useUpdateMyPasswordMutation(), {
        wrapper: createWrapper(createQueryClient()),
      });
      await act(async () => {
        if (condition === '로그아웃 상태') state.clearSession();
        await expect(
          result.current.mutateAsync({
            currentPassword: 'current-password',
            newPassword: 'new-password',
          }),
        ).rejects.toThrow('현재 사용자 정보가 필요합니다');
      });
      expect(requests).toBe(0);
    },
  );

  it.each([400, 401, 403, 503])(
    '변경 실패(%i) 시 기존 세션과 개인 캐시를 보존한다',
    async status => {
      server.use(
        http.put(
          `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD(':studentNumber')}`,
          () => HttpResponse.json({ code: 'CHANGE_FAILED' }, { status }),
        ),
      );
      useAuthStore.getState().markAuthenticated('STUDENT');
      useAuthStore.getState().setCurrentUser(demoStudent);
      const queryClient = createQueryClient();
      queryClient.setQueryData(['private-data'], 'existing');
      const { result } = renderHook(() => useUpdateMyPasswordMutation(), {
        wrapper: createWrapper(queryClient),
      });
      await act(async () => {
        await expect(
          result.current.mutateAsync({
            currentPassword: 'current-password',
            newPassword: 'new-password',
          }),
        ).rejects.toBeDefined();
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().currentUser).toEqual(demoStudent);
      expect(queryClient.getQueryData(['private-data'])).toBe('existing');
    },
  );

  it('로그아웃 서버 오류에도 로컬 세션과 QueryClient를 정리한다', async () => {
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, () =>
        HttpResponse.json(
          {
            code: 'LOGOUT_UNAVAILABLE',
            message: '잠시 후 다시 시도해 주세요.',
          },
          { status: 503 },
        ),
      ),
    );
    const queryClient = createQueryClient();
    queryClient.setQueryData(['private-data'], { shouldNotSurvive: true });
    const { result } = renderHook(() => useLogoutMutation(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toBeDefined();
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
  });
});
