import { setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminProfilePage from './AdminProfilePage';

import {
  getAdminProfile,
  resetAdminProfileMockData,
} from '~/mocks/data/adminProfile';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminProfileHandlers } from '~/mocks/handlers/adminProfile';

const server = setupServer(...adminProfileHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetAdminProfileMockData();
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser(demoAdmin);
});
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }

  return render(<AdminProfilePage />, { wrapper: Wrapper });
}

describe('AdminProfilePage', () => {
  it('이름과 이메일은 읽기 전용으로 표시한다', () => {
    renderPage();

    expect(screen.getByLabelText('이름')).toBeDisabled();
    expect(screen.getByLabelText('이메일')).toBeDisabled();
  });

  it('소개 메시지를 MSW에 저장하고 최신 값을 다시 표시한다', async () => {
    const user = userEvent.setup();
    renderPage();

    const introduction = await screen.findByLabelText('간단한 메시지');
    const introductionText = '안녕하세요. OOP 팀프로젝트 담당 조교입니다.';
    await user.type(introduction, introductionText);
    expect(screen.getByLabelText('간단한 메시지')).toHaveValue(
      introductionText,
    );
    expect(
      screen.getByRole('button', { name: '저장하기' }),
    ).toBeInTheDocument();
    expect(getAdminProfile().introduction).toBe('');
    await user.click(screen.getByRole('button', { name: '저장하기' }));

    expect(
      await screen.findByText('소개 메시지를 저장했습니다.'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(getAdminProfile().introduction).toBe(introductionText),
    );
    expect(screen.getByText(introductionText)).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: '간단한 메시지' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '수정하기' }));
    expect(screen.getByLabelText('간단한 메시지')).toHaveValue(
      introductionText,
    );
    expect(
      screen.getByRole('button', { name: '저장하기' }),
    ).toBeInTheDocument();
  });
});
