import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import { useAuthStore } from '~/features/auth/authStore';
import { useStudentContext } from '~/features/section/useStudentContext';

import StudentShell from './StudentShell';
import { StudentHeaderActions } from './StudentShellPopovers';
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
  vi.unstubAllEnvs();
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

function renderHeader(
  initialPath?: string,
  currentUser: CurrentUser = demoStudent,
) {
  useAuthStore.getState().markAuthenticated('STUDENT');
  useAuthStore.getState().setCurrentUser(currentUser);
  mockSessionResponseHeaders(issueMockSession(demoUserAccounts[0]));
  const context = createWrapper(initialPath);
  return {
    ...render(<StudentShell />, {
      wrapper: context.wrapper,
    }),
    ...context,
  };
}

function renderHeaderActions(
  initialPath = '/onboarding/team',
  currentUser: CurrentUser = demoStudent,
) {
  useAuthStore.getState().markAuthenticated('STUDENT');
  useAuthStore.getState().setCurrentUser(currentUser);
  mockSessionResponseHeaders(issueMockSession(demoUserAccounts[0]));
  const context = createWrapper(initialPath);
  return {
    ...render(<StudentHeaderActions currentUser={currentUser} />, {
      wrapper: context.wrapper,
    }),
    ...context,
  };
}

describe('StudentHeaderActions', () => {
  it('푸터 최하단에 로고 다음 문의 링크와 카피라이트를 표시한다', () => {
    renderHeader();

    const logo = screen.getByRole('img', { name: '경기대학교' });
    const contact = screen.getByRole('link', { name: '문의하기' });
    const copyright = screen.getByText(
      '© 2026 KGU Developers CSHOME. All rights reserved.',
    );

    expect(logo.compareDocumentPosition(contact)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(contact.compareDocumentPosition(copyright)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('로그아웃 실패 시 프로필과 로그인 상태를 유지하고 명시적으로 재시도한다', async () => {
    let respond!: (response: Response) => void;
    let requests = 0;
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`,
        () =>
          new Promise<Response>(resolve => {
            requests += 1;
            respond = resolve;
          }),
      ),
    );
    const { queryClient, router } = renderHeader();
    const navigate = vi.spyOn(router, 'navigate');
    queryClient.setQueryData(['private-data'], 'preserved');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '내 프로필 열기' }));
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(respond).toBeTypeOf('function'));
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeDisabled();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    respond(HttpResponse.json({}, { status: 503 }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '로그아웃하지 못했습니다. 로그인 상태가 유지됩니다.',
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(useAuthStore.getState().currentUser).toEqual(demoStudent);
    expect(queryClient.getQueryData(['private-data'])).toBe('preserved');
    await user.click(
      screen.getByRole('button', { name: '로그아웃 다시 시도' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '로그아웃' })).toBeDisabled(),
    );
    await waitFor(() => expect(requests).toBe(2));
    respond(new HttpResponse(null, { status: 204 }));
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false),
    );
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        expect.objectContaining({ to: '/login' }),
      ),
    );
    expect(
      screen.queryByRole('button', { name: '로그아웃 다시 시도' }),
    ).not.toBeInTheDocument();
  });

  it('실제 teamId가 있으면 프로필을 열 때 팀과 팀장을 조회하고 내 팀으로 연결한다', async () => {
    let requests = 0;
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('4')}`, () => {
        requests += 1;
        return HttpResponse.json({
          id: 4,
          name: '동시 선점 검수 팀',
          members: [
            {
              id: 6,
              studentNumber: '20260004',
              name: '동시 A',
              isLeader: true,
            },
            {
              id: 7,
              studentNumber: '20260005',
              name: '동시 B',
              isLeader: false,
            },
          ],
        });
      }),
    );
    renderHeader('/student', {
      ...demoStudent,
      teamId: '4',
      currentTeam: null,
    });
    expect(requests).toBe(0);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '내 프로필 열기' }));
    expect(await screen.findByText('동시 A (20260004)')).toBeVisible();
    expect(
      screen.getByRole('link', { name: '동시 선점 검수 팀' }),
    ).toHaveAttribute('href', '/student/team');
    expect(requests).toBe(1);
  });

  it.each(['0', '', 'invalid-team', '9007199254740993'])(
    '잘못된 팀 ID(%s)는 요청 없이 확인 필요로 표시한다',
    async teamId => {
      let requests = 0;
      server.use(
        http.get(`${API_BASE_URL}/api/v1/teams/:teamId/kickoff`, () => {
          requests += 1;
          return new HttpResponse(null, { status: 500 });
        }),
      );
      renderHeader('/student', {
        ...demoStudent,
        teamId,
        currentTeam: null,
      });
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: '내 프로필 열기' }));

      const profile = within(
        await screen.findByRole('dialog', { name: '내 프로필' }),
      );
      expect(profile.getByText('팀 정보 확인 필요')).toBeVisible();
      expect(profile.getByText('확인 필요')).toBeVisible();
      expect(profile.queryByText('확인 중…')).toBeNull();
      expect(profile.queryByText('미배정')).toBeNull();
      expect(profile.queryByText('미확정')).toBeNull();
      expect(requests).toBe(0);
    },
  );

  it('팀장 조회 실패를 미배정이나 미확정으로 잘못 표시하지 않는다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('4')}`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    renderHeader('/student', {
      ...demoStudent,
      teamId: '4',
      currentTeam: null,
    });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '내 프로필 열기' }));
    expect(await screen.findByText('팀 정보 확인 필요')).toBeVisible();
    expect(screen.getByText('확인 필요')).toBeVisible();
    expect(screen.queryByText('미확정')).toBeNull();
    expect(screen.queryByText('미배정')).toBeNull();
  });

  it('헤더는 홈·액션 플랜·공지사항·회의록·쪽지함 내비게이션과 현재 경로를 표시한다', () => {
    renderHeader('/student/notices/notice-1');

    const homeLink = screen.getByRole('link', { name: '홈' });
    const actionPlansLink = screen.getByRole('link', { name: '액션 플랜' });
    const noticesLink = screen.getByRole('link', { name: '공지사항' });
    const meetingsLink = screen.getByRole('link', { name: '회의록' });
    const messagesLink = screen.getByRole('link', { name: '쪽지함' });

    expect(homeLink).not.toHaveAttribute('aria-current', 'page');
    expect(actionPlansLink).not.toHaveAttribute('aria-current', 'page');
    expect(actionPlansLink).toHaveAttribute(
      'href',
      '/student/team/action-plans',
    );
    expect(noticesLink).toHaveAttribute('aria-current', 'page');
    expect(noticesLink).toHaveClass(styles.navLinkActive);
    expect(meetingsLink).not.toHaveAttribute('aria-current', 'page');
    expect(messagesLink).toHaveAttribute('href', '/student/messages');
    expect(messagesLink).not.toHaveAttribute('aria-current', 'page');
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
    expect(
      within(navigation).getByRole('link', { name: '쪽지함' }),
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
      await within(dialog).findByText('현재 비밀번호를 입력해 주세요.'),
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

it('redirects an assigned live student before contact release without requesting kickoff identity', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  const section = {
    id: 2,
    code: 'OOP-02',
    name: '테스트 분반',
    classTime: '',
    capacity: 40,
    contactVisibleFrom: '2099-01-01T00:00:00+09:00',
    contactVisibleUntil: null,
    courseId: 1,
    courseName: 'OOP',
    year: 2026,
    semester: 'FALL',
    status: 'ACTIVE',
  };
  let kickoffRequests = 0;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        ...demoStudent,
        globalRole: 'USER',
        sections: [section],
        teamId: 7,
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: [section] }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () => {
      kickoffRequests++;
      return HttpResponse.json({
        id: 7,
        name: '공개 전 팀 이름',
        members: [{ id: 1, name: '공개 전 팀원', studentNumber: '20260002' }],
      });
    }),
  );

  const { router } = renderHeader('/student', {
    ...demoStudent,
    teamId: '7',
  });

  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/onboarding/team'),
  );
  expect(kickoffRequests).toBe(0);
  expect(screen.queryByText('공개 전 팀 이름')).not.toBeInTheDocument();
  expect(screen.queryByText('공개 전 팀원')).not.toBeInTheDocument();
});

it('redirects an assigned live student without a confirmed leader back to onboarding', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  const section = {
    id: 2,
    code: 'OOP-02',
    name: '테스트 분반',
    classTime: '',
    capacity: 40,
    contactVisibleFrom: '2020-01-01T00:00:00+09:00',
    contactVisibleUntil: null,
    courseId: 1,
    courseName: 'OOP',
    year: 2026,
    semester: 'FALL',
    status: 'ACTIVE',
  };
  let kickoffRequests = 0;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        ...demoStudent,
        globalRole: 'USER',
        sections: [section],
        teamId: 7,
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: [section] }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () => {
      kickoffRequests++;
      return HttpResponse.json({
        id: 7,
        name: '팀장 미확정 팀',
        members: [
          {
            id: 1,
            isLeader: false,
            name: '팀원',
            studentNumber: '20260002',
          },
        ],
      });
    }),
  );

  const { router } = renderHeader('/student', {
    ...demoStudent,
    teamId: '7',
  });

  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/onboarding/team'),
  );
  expect(kickoffRequests).toBe(1);
});

it('shows neutral profile copy without requesting kickoff before contact release', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  const section = {
    id: 2,
    code: 'OOP-02',
    name: '테스트 분반',
    classTime: '',
    capacity: 40,
    contactVisibleFrom: '2099-01-01T00:00:00+09:00',
    contactVisibleUntil: null,
    courseId: 1,
    courseName: 'OOP',
    year: 2026,
    semester: 'FALL',
    status: 'ACTIVE',
  };
  let kickoffRequests = 0;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        ...demoStudent,
        globalRole: 'USER',
        sections: [section],
        teamId: 7,
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: [section] }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () => {
      kickoffRequests++;
      return HttpResponse.json({ id: 7, name: '공개 전 팀', members: [] });
    }),
  );

  const view = renderHeaderActions('/onboarding/team', {
    ...demoStudent,
    teamId: '7',
  });
  await userEvent.click(screen.getByRole('button', { name: '내 프로필 열기' }));

  expect(await screen.findAllByText('공개 예정')).toHaveLength(2);
  expect(kickoffRequests).toBe(0);
  expect(screen.queryByRole('link', { name: '공개 예정' })).toBeNull();
  expect(screen.queryByText('팀 정보 확인 필요')).toBeNull();
  expect(screen.queryByText('확인 중…')).toBeNull();
  view.unmount();
});

it('keeps an assigned student route and kickoff identity when contact release is unscheduled', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  const section = {
    id: 2,
    code: 'OOP-02',
    name: '테스트 분반',
    classTime: '',
    capacity: 40,
    contactVisibleFrom: null,
    contactVisibleUntil: null,
    courseId: 1,
    courseName: 'OOP',
    year: 2026,
    semester: 'FALL',
    status: 'ACTIVE',
  };
  let kickoffRequests = 0;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        ...demoStudent,
        globalRole: 'USER',
        sections: [section],
        teamId: 7,
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: [section] }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () => {
      kickoffRequests++;
      return HttpResponse.json({
        id: 7,
        name: '미설정 팀 이름',
        members: [
          {
            id: 1,
            name: '미설정 팀원',
            studentNumber: '20260002',
            isLeader: true,
          },
        ],
      });
    }),
  );

  const { router } = renderHeader('/student', {
    ...demoStudent,
    teamId: '7',
  });

  await waitFor(() => expect(router.state.location.pathname).toBe('/student'));
  await waitFor(() => expect(kickoffRequests).toBe(1));
  await userEvent.click(screen.getByRole('button', { name: '내 프로필 열기' }));
  expect(await screen.findByText('미설정 팀 이름')).toBeVisible();
  expect(screen.getByText('미설정 팀원 (20260002)')).toBeVisible();
  expect(kickoffRequests).toBe(2);
});

it('uses the selected live section in shell and profile, with no unattributed team request', async () => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  const sections = [1, 2].map(id => ({
    id,
    code: `SELECTED-0${id}`,
    name: `분반 ${id}`,
    classTime: '',
    capacity: 40,
    contactVisibleFrom: '2020-01-01T00:00:00+09:00',
    contactVisibleUntil: null,
    courseId: 1,
    courseName: 'OOP',
    year: 2026,
    semester: 'FALL',
    status: 'ACTIVE',
  }));
  let kickoffRequests = 0;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
      HttpResponse.json({
        ...demoStudent,
        studentNumber: 'shell-multiple',
        globalRole: 'USER',
        sections,
        teamId: 7,
      }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
      HttpResponse.json({ contents: sections }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () => {
      kickoffRequests++;
      return HttpResponse.json({ id: 7, name: 'unattributed', members: [] });
    }),
  );
  const { wrapper } = renderHeader('/student', {
    ...demoStudent,
    studentNumber: 'shell-multiple',
  });
  const { result } = renderHook(() => useStudentContext(), { wrapper });
  await waitFor(() => expect(result.current.status).toBe('selection-required'));
  expect(screen.queryByText(/SELECTED-01/)).not.toBeInTheDocument();
  act(() => result.current.selectSection(2));
  expect(
    screen.getByRole('link', { name: '객체지향프로그래밍 팀 프로젝트 홈' }),
  ).toHaveTextContent('/SELECTED-02');
  await userEvent.click(screen.getByRole('button', { name: '내 프로필 열기' }));
  expect(await screen.findByText('SELECTED-02')).toBeVisible();
  expect(screen.getByText('팀 소속 확인 필요')).toBeVisible();
  act(() => result.current.selectSection(1));
  expect(screen.getByText('SELECTED-01')).toBeVisible();
  expect(screen.queryByText('SELECTED-02')).not.toBeInTheDocument();
  expect(kickoffRequests).toBe(0);
});
