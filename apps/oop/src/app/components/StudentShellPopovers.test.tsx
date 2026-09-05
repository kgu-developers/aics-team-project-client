import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import {
  StudentHeaderActions,
  validatePasswordChange,
} from './StudentShellPopovers';
import * as styles from './StudentShellPopovers.css';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { authHandlers, resetDemoPasswordState } from '~/mocks/handlers/auth';

const server = setupServer(...authHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDemoPasswordState();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function createWrapper(initialPath = '/student') {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, retryDelay: 0 },
    },
  });
  const rootRoute = createRootRoute();
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    routeTree: rootRoute,
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastViewport>
            <RouterContextProvider router={router}>
              {children}
            </RouterContextProvider>
          </ToastViewport>
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}

function renderHeader(initialPath?: string) {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  return render(<StudentHeaderActions currentUser={demoStudent} />, {
    wrapper: createWrapper(initialPath),
  });
}

describe('StudentHeaderActions', () => {
  it('헤더는 홈·액션 플랜·공지사항·회의록 텍스트 내비게이션과 현재 경로를 표시한다', () => {
    renderHeader('/student/notices/notice-1');

    const homeLink = screen.getByRole('link', { name: '홈' });
    const actionPlansLink = screen.getByRole('link', { name: '액션 플랜' });
    const noticesLink = screen.getByRole('link', { name: '공지사항' });
    const meetingsLink = screen.getByRole('link', { name: '회의록' });

    expect(homeLink).not.toHaveAttribute('aria-current', 'page');
    expect(actionPlansLink).not.toHaveAttribute('aria-current', 'page');
    expect(actionPlansLink).toHaveAttribute(
      'href',
      '/student/team/action-plans',
    );
    expect(noticesLink).toHaveAttribute('aria-current', 'page');
    expect(noticesLink).toHaveClass(styles.navLinkActive);
    expect(meetingsLink).not.toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('button', { name: '공지사항 열기' })).toBeNull();
    expect(screen.queryByRole('button', { name: '회의록 열기' })).toBeNull();
  });

  it('trailing slash가 있는 학생 홈에서도 홈 메뉴를 현재 위치로 표시한다', () => {
    renderHeader('/student/');

    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('모바일 메뉴는 토글 상태를 알리고 메뉴 링크를 누르면 닫힌다', async () => {
    const user = userEvent.setup();
    renderHeader();

    const menuButton = screen.getByRole('button', { name: '학생 메뉴 열기' });
    const navigation = screen.getByRole('navigation', { name: '학생 메뉴' });

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute(
      'aria-controls',
      'student-header-navigation',
    );
    expect(navigation).not.toHaveClass(styles.headerNavOpen);

    await user.click(menuButton);
    expect(
      screen.getByRole('button', { name: '학생 메뉴 닫기' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(navigation).toHaveClass(styles.headerNavOpen);
    expect(screen.queryByLabelText('학생 정보')).toBeNull();
    expect(within(navigation).getByRole('link', { name: '홈' })).toBeVisible();
    expect(
      within(navigation).getByRole('link', { name: '액션 플랜' }),
    ).toBeVisible();
    expect(
      within(navigation).getByRole('link', { name: '공지사항' }),
    ).toBeVisible();
    expect(
      within(navigation).getByRole('link', { name: '회의록' }),
    ).toBeVisible();

    const profileButton = screen.getByRole('button', {
      name: '내 프로필 열기',
    });
    expect(
      profileButton.compareDocumentPosition(menuButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(screen.getByRole('link', { name: '공지사항' }));
    expect(
      screen.getByRole('button', { name: '학생 메뉴 열기' }),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(navigation).not.toHaveClass(styles.headerNavOpen);
  });

  it('프로필 팝오버에서 비밀번호 변경 Dialog를 열고 필수값을 검증한다', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));
    const profileDialog = await screen.findByRole('dialog', {
      name: '내 프로필',
    });
    expect(profileDialog).toBeInTheDocument();
    expect(within(profileDialog).getByText('월8/1151')).toBeInTheDocument();
    expect(
      within(profileDialog).getByText('CineFlow (7팀)'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    expect(
      await screen.findByText('현재 비밀번호를 입력해 주세요.'),
    ).toBeInTheDocument();
  });

  it('비밀번호 변경 성공 시 완료 안내를 표시한다', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));
    await screen.findByRole('dialog', { name: '내 프로필' });
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    const passwordDialog = await screen.findByRole('dialog', {
      name: '비밀번호 변경',
    });

    const getPasswordInput = (name: string) => {
      const input = passwordDialog.querySelector<HTMLInputElement>(
        `input[name="${name}"]`,
      );
      if (!input)
        throw new Error(`비밀번호 입력 필드를 찾을 수 없습니다: ${name}`);
      return input;
    };

    await user.type(getPasswordInput('currentPassword'), 'oop-demo-a');
    await user.type(getPasswordInput('newPassword'), 'oop-demo-c-next');
    await user.type(getPasswordInput('confirmPassword'), 'oop-demo-c-next');
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    expect(
      await screen.findByText('비밀번호를 변경했어요.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '비밀번호 변경' })).toBeNull();
  });
});

describe('validatePasswordChange', () => {
  it('백엔드 정책과 일치하지 않는 새 비밀번호를 구분해 안내한다', () => {
    expect(validatePasswordChange('', 'new-password', 'new-password')).toEqual({
      field: 'currentPassword',
      message: '현재 비밀번호를 입력해 주세요.',
    });
    expect(validatePasswordChange('current', 'short', 'short')).toEqual({
      field: 'newPassword',
      message: '새 비밀번호는 8자 이상이어야 합니다.',
    });
    expect(
      validatePasswordChange('current-password', 'new-password', 'different'),
    ).toEqual({
      field: 'confirmPassword',
      message: '새 비밀번호가 일치하지 않습니다.',
    });
    expect(
      validatePasswordChange(
        'current-password',
        'new-password',
        'new-password',
      ),
    ).toBeNull();
  });
});
