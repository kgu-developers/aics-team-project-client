import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { authKeys } from '~/features/auth/queries';

import { useUpdateAdminOopSectionMutation } from './useUpdateAdminOopSectionMutation';

import { demoAdmin } from '~/mocks/data/users';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  useAuthStore.setState({ currentUser: null });
});
afterAll(() => server.close());

it('분반 코드 저장 성공 후 현재 사용자 분반도 서버 응답으로 갱신한다', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const currentUser = {
    ...demoAdmin,
    sections: [
      {
        ...demoAdmin.sections[0]!,
        code: '이전 분반 코드',
        name: '이전 분반명',
      },
    ],
  };
  useAuthStore.setState({ currentUser });
  queryClient.setQueryData(authKeys.currentUser(), currentUser);
  server.use(
    http.patch(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION(1)}`, () =>
      HttpResponse.json({
        capacity: 40,
        classTime: '월요일 1-2교시',
        code: '현재 분반 코드',
        course: {
          id: 1,
          name: '객체지향 프로그래밍',
          semester: 'FALL',
          status: 'ACTIVE',
          year: 2026,
        },
        id: 1,
        name: '현재 분반명',
        professor: {
          email: 'professor@example.com',
          globalRole: 'ADMIN',
          name: '담당 교수',
          phone: '010-0000-0000',
          studentNumber: '20260002',
        },
      }),
    ),
  );
  const { result } = renderHook(() => useUpdateAdminOopSectionMutation(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  await act(async () => {
    await result.current.mutateAsync({
      input: { code: '현재 분반 코드' },
      sectionId: 1,
    });
  });

  expect(useAuthStore.getState().currentUser?.sections[0]).toMatchObject({
    code: '현재 분반 코드',
    name: '현재 분반명',
  });
  expect(queryClient.getQueryData(authKeys.currentUser())).toMatchObject({
    sections: [
      expect.objectContaining({
        code: '현재 분반 코드',
        name: '현재 분반명',
      }),
    ],
  });
});
