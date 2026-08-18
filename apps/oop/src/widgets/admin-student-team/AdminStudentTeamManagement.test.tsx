import { API_BASE_URL } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { delay, HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';

import AdminStudentTeamManagement from './AdminStudentTeamManagement';

const server = setupServer(...adminStudentTeamHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}

function renderPage() {
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser(demoAdmin);

  return render(<AdminStudentTeamManagement />, { wrapper: createWrapper() });
}

describe('AdminStudentTeamManagement', () => {
  it('목록을 기다리는 동안 로딩 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/admin/sections/:sectionId/students`,
        async () => {
          await delay(1_000);
          return HttpResponse.json([]);
        },
      ),
    );

    renderPage();

    expect(
      await screen.findByText('수강생과 팀 목록을 불러오는 중입니다.'),
    ).toBeInTheDocument();
  });

  it('수강생 목록이 비어 있으면 빈 상태를 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/sections/:sectionId/students`, () =>
        HttpResponse.json([]),
      ),
    );

    renderPage();

    expect(
      await screen.findByText('이 분반에 등록된 수강생이 없습니다.'),
    ).toBeInTheDocument();
  });

  it('목록 요청이 실패하면 오류 상태를 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}/admin/sections/:sectionId/students`, () =>
        HttpResponse.json(
          {
            code: 'STUDENT_LOOKUP_FAILED',
            message: '목록을 불러오지 못했습니다.',
          },
          { status: 500 },
        ),
      ),
    );

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText(
          '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      ).toBeInTheDocument(),
    );
  });
});
