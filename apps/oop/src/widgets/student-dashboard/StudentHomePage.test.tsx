import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentHomePage, { getDashboardErrorContent } from './StudentHomePage';

import { demoStudent } from '~/mocks/data/users';

const server = setupServer();

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

describe('StudentHomePage', () => {
  it.each([
    [401, '로그인이 필요해요.'],
    [403, '이 분반에 접근할 수 없어요.'],
    [404, '분반 대시보드를 찾지 못했어요.'],
  ])('%s 응답에 맞는 오류 제목을 제공한다', (status, expectedTitle) => {
    const error = { isAxiosError: true, response: { status } };

    expect(getDashboardErrorContent(error).title).toBe(expectedTitle);
  });

  it('학생에게 소속 분반이 없으면 안내 상태를 표시한다', () => {
    useAuthStore.getState().setCurrentUser({ ...demoStudent, sections: [] });
    const Wrapper = createWrapper();

    render(<StudentHomePage />, { wrapper: Wrapper });

    expect(screen.getByText('소속 분반이 없어요.')).toBeInTheDocument();
  });

  it('분반 접근이 거부되면 권한 오류를 구분해서 표시한다', async () => {
    server.use(
      http.get(
        'http://localhost:8080/sections/:sectionId/dashboard/student',
        () =>
          HttpResponse.json(
            { code: 'SECTION_ACCESS_DENIED', message: '접근할 수 없습니다.' },
            { status: 403 },
          ),
      ),
    );
    useAuthStore.getState().setCurrentUser(demoStudent);
    const Wrapper = createWrapper();

    render(<StudentHomePage />, { wrapper: Wrapper });

    await waitFor(() =>
      expect(
        screen.getByText('이 분반에 접근할 수 없어요.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();
  });
});
