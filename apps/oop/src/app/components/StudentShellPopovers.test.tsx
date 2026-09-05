import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentShell from './StudentShell';
import * as styles from './StudentShellPopovers.css';

import {
  issueMockSession,
  mockSessionResponseHeaders,
  mockCsrfCookieName,
} from '~/mocks/authSession';
import { demoStudent, demoUserAccounts } from '~/mocks/data/users';
import { authHandlers, resetDemoPasswordState } from '~/mocks/handlers/auth';

const server = setupServer(...authHandlers);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  queryClients.splice(0).forEach(client => client.clear());
  resetDemoPasswordState();
  useAuthStore.getState().clearSession();
  document.cookie = `${mockCsrfCookieName}=; Max-Age=0; Path=/`;
});
afterAll(() => server.close());

function createWrapper(initialPath = '/student') {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, retryDelay: 0 },
    },
  });
  queryClients.push(queryClient);
  const rootRoute = createRootRoute();
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    routeTree: rootRoute,
  });

  function Wrapper({ children }: PropsWithChildren) {
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
  }
  return { wrapper: Wrapper, router, queryClient };
}

function renderHeader(initialPath?: string) {
  useAuthStore.getState().markAuthenticated('STUDENT');
  useAuthStore.getState().setCurrentUser(demoStudent);
  mockSessionResponseHeaders(issueMockSession(demoUserAccounts[0]));
  const context = createWrapper(initialPath);
  return {
    ...render(<StudentShell />, {
      wrapper: context.wrapper,
    }),
    ...context,
  };
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

  it('비밀번호 변경 성공 시 완료 안내와 로그인 이동, 세션 정리를 수행한다', async () => {
    const user = userEvent.setup();
    const { router, queryClient } = renderHeader();
    queryClient.setQueryData(['private-data'], 'existing');

    await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));
    await screen.findByRole('dialog', { name: '내 프로필' });
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    const passwordDialog = await screen.findByRole('dialog', {
      name: '비밀번호 변경',
    });

    await user.type(
      within(passwordDialog).getByLabelText('현재 비밀번호', { exact: false }),
      'oop-demo-a',
    );
    await user.type(
      within(passwordDialog).getByLabelText(/^새 비밀번호(?! 확인)/),
      'oop-demo-c-next',
    );
    await user.type(
      within(passwordDialog).getByLabelText('새 비밀번호 확인', {
        exact: false,
      }),
      'oop-demo-c-next',
    );
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));

    expect(
      await screen.findByText('비밀번호를 변경했어요. 다시 로그인해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: '비밀번호 변경' })).toBeNull();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
  });

  it('요청 중 입력·취소·중복 제출을 막고 실패 후 다시 입력할 수 있다', async () => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => {
      release = resolve;
    });
    let requests = 0;
    server.use(
      http.put(
        `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD(':studentNumber')}`,
        async () => {
          requests += 1;
          await pending;
          return HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
        },
      ),
    );
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));
    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' });
    const currentInput = within(dialog).getByLabelText('현재 비밀번호', {
      exact: false,
    });
    await user.type(currentInput, 'current-password');
    await user.type(
      within(dialog).getByLabelText(/^새 비밀번호(?! 확인)/),
      'new-password',
    );
    await user.type(
      within(dialog).getByLabelText('새 비밀번호 확인', { exact: false }),
      'new-password',
    );
    const submit = within(dialog).getByRole('button', {
      name: '비밀번호 변경',
    });
    await user.click(submit);
    try {
      await waitFor(() => expect(requests).toBe(1));
      expect(currentInput).toBeDisabled();
      expect(submit).toBeDisabled();
      expect(
        within(dialog).getByRole('button', { name: '취소' }),
      ).toBeDisabled();
      await user.click(submit);
      expect(requests).toBe(1);
    } finally {
      release();
    }
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      '잠시 후 다시 시도해 주세요.',
    );
    expect(currentInput).toBeEnabled();
    expect(submit).toBeEnabled();
  });

  it.each([
    [401, 'INVALID_CREDENTIALS', '현재 비밀번호가 올바르지 않습니다.'],
    [
      401,
      'UNAUTHORIZED',
      '로그인 상태를 확인할 수 없어요. 다시 로그인해 주세요.',
    ],
    [
      403,
      'ACCESS_DENIED',
      '비밀번호 변경 권한을 확인할 수 없어요. 다시 로그인한 뒤 시도해 주세요.',
    ],
    [
      503,
      'UNAVAILABLE',
      '비밀번호를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.',
    ],
    [0, '', '네트워크 연결을 확인한 뒤 다시 시도해 주세요.'],
  ])(
    '실패(%s, %s)는 원인에 맞게 안내하고 폼과 세션을 유지한다',
    async (status, code, message) => {
      server.use(
        http.put(
          `${API_BASE_URL}${ENDPOINTS.PROFILE.PASSWORD(':studentNumber')}`,
          () =>
            status
              ? HttpResponse.json({ code }, { status })
              : HttpResponse.error(),
        ),
      );
      const user = userEvent.setup();
      const { router } = renderHeader();
      await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));
      await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
      const dialog = await screen.findByRole('dialog', {
        name: '비밀번호 변경',
      });
      await user.type(
        within(dialog).getByLabelText('현재 비밀번호', { exact: false }),
        'wrong-password',
      );
      await user.type(
        within(dialog).getByLabelText(/^새 비밀번호(?! 확인)/),
        'new-password',
      );
      await user.type(
        within(dialog).getByLabelText('새 비밀번호 확인', { exact: false }),
        'new-password',
      );
      await user.click(
        within(dialog).getByRole('button', { name: '비밀번호 변경' }),
      );
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        message,
      );
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(router.state.location.pathname).toBe('/student');
      expect(
        screen.queryByText('비밀번호를 변경했어요. 다시 로그인해 주세요.'),
      ).not.toBeInTheDocument();
    },
  );
});
