import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDemoPasswordState();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('auth mutations', () => {
  it('비밀번호 변경 요청을 API에 전달한다', async () => {
    useAuthStore.getState().setAccessToken(demoAccessToken);
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useUpdateMyPasswordMutation(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        currentPassword: demoCredentials.password,
        newPassword: 'oop-new-password',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    queryClient.clear();
  });

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
