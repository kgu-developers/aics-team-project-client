import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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

import AdminCourseDetailPage from './AdminCourseDetailPage';
import AdminCoursesPage from './AdminCoursesPage';

import {
  issueMockSession,
  mockSessionResponseHeaders,
} from '~/mocks/authSession';
import { resetAdminCoursesMockData } from '~/mocks/data/adminCourses';
import { resetAdminProfileMockData } from '~/mocks/data/adminProfile';
import { resetAdminSectionsMockData } from '~/mocks/data/adminSections';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoAccessToken,
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminProfileHandlers } from '~/mocks/handlers/adminProfile';
import { adminSectionHandlers } from '~/mocks/handlers/adminSections';
import {
  adminStudentTeamHandlers,
  resetAdminStudentTeamMockState,
} from '~/mocks/handlers/adminStudentTeams';
import { authHandlers } from '~/mocks/handlers/auth';
import { sectionHandlers } from '~/mocks/handlers/section';

const server = setupServer(
  ...adminCourseHandlers,
  ...adminSectionHandlers,
  ...adminStudentTeamHandlers,
  ...adminProfileHandlers,
  ...authHandlers,
  ...sectionHandlers,
);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetAdminCoursesMockData();
  resetAdminSectionsMockData();
  resetAdminStudentTeamMockState();
  resetAdminProfileMockData();
  mockSessionResponseHeaders(
    issueMockSession(
      demoUserAccounts.find(
        account => account.user.studentNumber === demoAdmin.studentNumber,
      )!,
    ),
  );
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: demoAdmin,
    sessionRole: 'ASSISTANT',
  });
});
afterEach(() => {
  server.resetHandlers();
  queryClients.splice(0).forEach(queryClient => queryClient.clear());
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderAt(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  queryClients.push(queryClient);
  const root = createRootRoute({ component: Outlet });
  const sectionsRoute = createRoute({
    component: Outlet,
    getParentRoute: () => root,
    path: '/admin/sections',
  });
  const listRoute = createRoute({
    component: AdminCoursesPage,
    getParentRoute: () => sectionsRoute,
    path: '/',
  });
  const detailRoute = createRoute({
    component: AdminCourseDetailPage,
    getParentRoute: () => sectionsRoute,
    path: '/$courseId',
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: root.addChildren([
      sectionsRoute.addChildren([listRoute, detailRoute]),
    ]),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ToastViewport />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return router;
}

async function openAssistantDialog(user: UserEvent) {
  const row = await screen.findByRole('row', { name: 'OOP-01 분반 설정' });
  await user.click(within(row).getByRole('button', { name: '조교 관리' }));
  return screen.findByRole('dialog', { name: 'OOP-01 조교 관리' });
}

describe('AdminCoursesPage', () => {
  it('연도·학기·상태를 표시하고 행을 누르면 강좌 상세로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/admin/sections');

    // Two courses share the name (2026 ACTIVE, 2025 ARCHIVED).
    const row = (
      await screen.findAllByRole('row', {
        name: '객체지향 프로그래밍 강좌 상세 보기',
      })
    )[0]!;
    expect(within(row).getByText('운영 중')).toBeInTheDocument();
    expect(within(row).getByText('2학기')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '삭제' }),
    ).not.toBeInTheDocument();

    await user.click(row);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/sections/1'),
    );
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '객체지향 프로그래밍',
      }),
    ).toBeInTheDocument();
  });

  it('강좌를 등록한다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections');
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getByRole('button', { name: '강좌 등록' }));
    const dialog = screen.getByRole('dialog', { name: '강좌 등록' });
    await user.type(
      within(dialog).getByRole('textbox', { name: /강좌명/ }),
      '알고리즘',
    );
    await user.click(within(dialog).getByRole('button', { name: '등록' }));

    expect(await screen.findByText('알고리즘')).toBeInTheDocument();
  });

  it('연도가 비어 있으면 강좌 등록을 막는다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections');
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getByRole('button', { name: '강좌 등록' }));
    const dialog = screen.getByRole('dialog', { name: '강좌 등록' });
    await user.type(
      within(dialog).getByRole('textbox', { name: /강좌명/ }),
      '알고리즘',
    );
    await user.clear(within(dialog).getByRole('textbox', { name: /연도/ }));

    expect(within(dialog).getByRole('button', { name: '등록' })).toBeDisabled();
  });
});

describe('AdminCourseDetailPage', () => {
  it('강좌 정보와 연결된 분반을 표로 보여 준다', async () => {
    renderAt('/admin/sections/1');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '객체지향 프로그래밍',
      }),
    ).toBeInTheDocument();
    const table = await screen.findByRole('table', {
      name: '연결된 분반 목록',
    });
    const row = within(table).getByRole('row', { name: 'OOP-01 분반 설정' });
    expect(within(row).getByText('월요일 1-2교시')).toBeInTheDocument();
    expect(within(row).getByText('40명')).toBeInTheDocument();
    expect(within(row).getByText('미설정')).toBeInTheDocument();
    expect(await within(row).findByText('없음')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '사전 정보 내역' }),
    ).not.toBeInTheDocument();
  });

  it('없는 강좌는 목록으로 돌아가는 안내를 보여 준다', async () => {
    renderAt('/admin/sections/999');
    expect(
      await screen.findByText('강좌를 찾을 수 없습니다.'),
    ).toBeInTheDocument();
  });

  it('분반을 등록하면 표에 추가된다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    await screen.findByRole('row', { name: 'OOP-01 분반 설정' });

    await user.click(screen.getByRole('button', { name: '분반 등록' }));
    const dialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 등록',
    });
    await user.type(
      within(dialog).getByRole('textbox', { name: /분반 코드/ }),
      'OOP-02',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: /수업 시간/ }),
      '수요일 3-4교시',
    );
    await user.click(within(dialog).getByRole('button', { name: '등록' }));

    expect(
      await screen.findByRole('row', { name: 'OOP-02 분반 설정' }),
    ).toBeInTheDocument();
  });

  it('분반 생성 후 목록 갱신이 실패하면 같은 분반을 다시 등록하지 않는다', async () => {
    const user = userEvent.setup();
    let sectionCreateRequests = 0;
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}`, () => {
        sectionCreateRequests += 1;
        return HttpResponse.json({ id: 99 }, { status: 201 });
      }),
      http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
        HttpResponse.json({ code: 'REFRESH_FAILED' }, { status: 500 }),
      ),
    );
    renderAt('/admin/sections/1');
    await screen.findByRole('row', { name: 'OOP-01 분반 설정' });

    await user.click(screen.getByRole('button', { name: '분반 등록' }));
    const dialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 등록',
    });
    const codeInput = within(dialog).getByRole('textbox', {
      name: /분반 코드/,
    });
    await user.type(codeInput, 'OOP-02');
    await user.type(
      within(dialog).getByRole('textbox', { name: /수업 시간/ }),
      '수요일 3-4교시',
    );
    await user.click(within(dialog).getByRole('button', { name: '등록' }));

    expect(
      await within(dialog).findByText('분반 목록을 새로고침하지 못했습니다.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '등록' })).toBeDisabled();

    await user.click(codeInput);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(sectionCreateRequests).toBe(1));
  });

  it('행을 누르면 분반 설정을 열고 취소할 수 있다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    await user.click(
      await screen.findByRole('row', { name: 'OOP-01 분반 설정' }),
    );
    const settingsDialog = await screen.findByRole('dialog', {
      name: '분반 정보 수정',
    });
    await user.click(
      within(settingsDialog).getByRole('button', { name: '취소' }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '분반 정보 수정' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('분반 설정을 저장하는 동안 모든 설정 입력을 잠근다', async () => {
    const user = userEvent.setup();
    let resolveSectionUpdate: (() => void) | undefined;
    server.use(
      http.patch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION(':sectionId')}`,
        async () => {
          await new Promise<void>(resolve => {
            resolveSectionUpdate = resolve;
          });
          return HttpResponse.json({});
        },
      ),
    );

    renderAt('/admin/sections/1');
    await user.click(
      await screen.findByRole('row', { name: 'OOP-01 분반 설정' }),
    );

    const settingsDialog = await screen.findByRole('dialog', {
      name: '분반 정보 수정',
    });
    await user.click(
      within(settingsDialog).getByRole('button', { name: '저장' }),
    );
    await waitFor(() => expect(resolveSectionUpdate).toBeTypeOf('function'));

    expect(
      within(settingsDialog).getByRole('textbox', { name: /^분반 코드/ }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('textbox', { name: /^수업 시간/ }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('textbox', { name: /^정원/ }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('combobox', {
        name: '공개 시작 날짜',
      }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('textbox', {
        name: '공개 시작 시간',
      }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('combobox', {
        name: '공개 종료 날짜',
      }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('textbox', {
        name: '공개 종료 시간',
      }),
    ).toBeDisabled();

    resolveSectionUpdate?.();
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: '분반 정보 수정' }),
      ).not.toBeInTheDocument();
    });
  });

  it('분반 설정에서 삭제 확인 후 표에서 제거한다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    await user.click(
      await screen.findByRole('row', { name: 'OOP-01 분반 설정' }),
    );
    const settingsDialog = await screen.findByRole('dialog', {
      name: '분반 정보 수정',
    });

    await user.click(
      within(settingsDialog).getByRole('button', { name: '분반 삭제' }),
    );
    await user.click(
      within(settingsDialog).getByRole('button', { name: '분반 삭제 확인' }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole('row', { name: 'OOP-01 분반 설정' }),
      ).not.toBeInTheDocument();
    });
  });

  it('조교 관리에서 조교 목록과 등록 버튼을 표시한다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    const sectionDialog = await openAssistantDialog(user);
    expect(
      await within(sectionDialog).findByText('등록된 조교가 없습니다.'),
    ).toBeInTheDocument();
    expect(
      within(sectionDialog).getByRole('button', { name: '조교 등록' }),
    ).toBeInTheDocument();
  });

  it('조교를 등록하고 수정한 뒤 현재 분반에서만 제외할 수 있다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    const sectionDialog = await openAssistantDialog(user);
    await user.click(
      within(sectionDialog).getByRole('button', { name: '조교 등록' }),
    );
    const enrollmentDialog = await screen.findByRole('dialog', {
      name: '조교 등록',
    });

    await user.type(
      within(enrollmentDialog).getByRole('textbox', { name: '학번' }),
      '202699999',
    );
    await user.type(
      within(enrollmentDialog).getByRole('textbox', { name: '이름' }),
      '테스트 조교',
    );
    await user.type(
      within(enrollmentDialog).getByRole('textbox', { name: '이메일' }),
      'assistant@example.com',
    );
    await user.type(
      within(enrollmentDialog).getByRole('textbox', { name: '전화번호' }),
      '010-0000-0000',
    );
    await user.type(
      within(enrollmentDialog).getByLabelText('초기 비밀번호'),
      'password123',
    );
    await user.click(
      within(enrollmentDialog).getByRole('button', { name: '조교 등록' }),
    );

    expect(
      await within(sectionDialog).findByText(/테스트 조교/),
    ).toBeInTheDocument();
    await user.click(
      within(sectionDialog).getByRole('button', { name: '수정' }),
    );
    const editDialog = await screen.findByRole('dialog', {
      name: '조교 정보 수정',
    });
    expect(
      within(editDialog).getByRole('textbox', { name: '이름' }),
    ).toHaveValue('테스트 조교');
    await user.clear(within(editDialog).getByRole('textbox', { name: '이름' }));
    await user.type(
      within(editDialog).getByRole('textbox', { name: '이름' }),
      '수정된 조교',
    );
    await user.click(
      within(editDialog).getByRole('button', { name: '수정 저장' }),
    );
    expect(
      await within(sectionDialog).findByText(/수정된 조교/),
    ).toBeInTheDocument();

    await user.click(
      within(sectionDialog).getByRole('button', { name: '분반에서 제외' }),
    );
    const deleteDialog = (
      await screen.findByText('조교를 이 분반에서 제외할까요?')
    ).closest('dialog');
    expect(deleteDialog).not.toBeNull();
    expect(
      within(deleteDialog!).getByText(/계정과 다른 분반 소속은 유지됩니다/),
    ).toBeInTheDocument();
    await user.click(
      within(deleteDialog!).getByRole('button', { name: '분반에서 제외' }),
    );
    await waitFor(() => {
      expect(
        within(sectionDialog).queryByText(/수정된 조교/),
      ).not.toBeInTheDocument();
    });
  });

  it('조교 등록 비밀번호는 조합과 무관하게 8자 이상 64자 이하만 허용한다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    const sectionDialog = await openAssistantDialog(user);
    await user.click(
      within(sectionDialog).getByRole('button', { name: '조교 등록' }),
    );
    const dialog = await screen.findByRole('dialog', { name: '조교 등록' });

    await user.type(
      within(dialog).getByRole('textbox', { name: '학번' }),
      '202688888',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: '이름' }),
      '비밀번호 조교',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: '이메일' }),
      'password@example.com',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: '전화번호' }),
      '010-0000-0000',
    );
    const password = within(dialog).getByLabelText('초기 비밀번호');
    const submit = within(dialog).getByRole('button', { name: '조교 등록' });

    await user.type(password, '1234567');
    expect(submit).toBeDisabled();
    expect(
      within(dialog).getByText('비밀번호는 8자 이상 64자 이하여야 합니다.'),
    ).toBeInTheDocument();

    await user.type(password, '8');
    expect(submit).toBeEnabled();

    await user.type(password, 'a'.repeat(57));
    expect(submit).toBeDisabled();
  });

  it('강좌 정보 수정에서 운영 상태를 보관됨으로 바꾼다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections/1');
    await screen.findByRole('heading', {
      level: 1,
      name: '객체지향 프로그래밍',
    });

    await user.click(screen.getByRole('button', { name: '강좌 정보 수정' }));
    const dialog = await screen.findByRole('dialog', {
      name: '강좌 상세 및 수정',
    });
    await user.click(
      within(dialog).getByRole('combobox', { name: '운영 상태' }),
    );
    await user.click(screen.getByRole('option', { name: '보관됨' }));
    await user.click(within(dialog).getByRole('button', { name: '수정 저장' }));

    expect((await screen.findAllByText('보관됨')).length).toBeGreaterThan(0);
  });

  it('강좌를 삭제하면 목록으로 돌아간다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/admin/sections/1');
    await screen.findByRole('heading', {
      level: 1,
      name: '객체지향 프로그래밍',
    });

    await user.click(screen.getByRole('button', { name: '강좌 삭제' }));
    const dialog = await screen.findByRole('dialog', {
      name: '강좌 삭제 확인',
    });
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/admin/sections'),
    );
    await screen.findByRole('row', { name: '웹 프로그래밍 강좌 상세 보기' });
    // Only the 2025 archived course of the same name remains.
    await waitFor(() =>
      expect(
        screen.getAllByRole('row', {
          name: '객체지향 프로그래밍 강좌 상세 보기',
        }),
      ).toHaveLength(1),
    );
  });
});

describe('admin section API contract', () => {
  it('분반 PATCH의 잘못된 body를 400으로 처리한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION(1)}`,
      {
        body: 'null',
        headers: {
          Authorization: `Bearer ${demoAdminAccessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      },
    );

    expect(response.status).toBe(400);
  });

  it('분반 재배정 필드는 기본 정보 PATCH에서 거부한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION(1)}`,
      {
        body: JSON.stringify({ courseId: 2 }),
        headers: {
          Authorization: `Bearer ${demoAdminAccessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      },
    );

    expect(response.status).toBe(400);
  });

  it('공개 기간이 역전되면 PATCH를 400으로 처리한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION_CONTACT_VISIBILITY(1)}`,
      {
        body: JSON.stringify({
          visibleFrom: '2026-10-08T23:59:59',
          visibleUntil: '2026-10-01T09:00:00',
        }),
        headers: {
          Authorization: `Bearer ${demoAdminAccessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      },
    );

    expect(response.status).toBe(400);
  });

  it('공개 기간을 null로 보내면 공개 설정을 해제한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION_CONTACT_VISIBILITY(1)}`,
      {
        body: JSON.stringify({ visibleFrom: null, visibleUntil: null }),
        headers: {
          Authorization: `Bearer ${demoAdminAccessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      },
    );
    const updated = (await response.json()) as {
      contactVisibleFrom: string | null;
      contactVisibleUntil: string | null;
    };

    expect(response.status).toBe(200);
    expect(updated.contactVisibleFrom).toBeNull();
    expect(updated.contactVisibleUntil).toBeNull();
  });

  it('분반 기본 정보와 공개 기간 PATCH를 각각 저장한다', async () => {
    const headers = {
      Authorization: `Bearer ${demoAdminAccessToken}`,
      'Content-Type': 'application/json',
    };
    const basicResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION(1)}`,
      {
        body: JSON.stringify({
          capacity: 45,
          classTime: '목요일 1-2교시',
          code: 'OOP-01A',
        }),
        headers,
        method: 'PATCH',
      },
    );
    const visibilityResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTION_CONTACT_VISIBILITY(1)}`,
      {
        body: JSON.stringify({
          visibleFrom: '2026-10-01T09:00:00',
          visibleUntil: '2026-10-08T23:59:59',
        }),
        headers,
        method: 'PATCH',
      },
    );
    const updated = (await visibilityResponse.json()) as {
      capacity: number;
      code: string;
      contactVisibleFrom: string;
      contactVisibleUntil: string;
    };

    expect(basicResponse.status).toBe(200);
    expect(visibilityResponse.status).toBe(200);
    expect(updated).toMatchObject({
      capacity: 45,
      code: 'OOP-01A',
      contactVisibleFrom: '2026-10-01T09:00:00',
      contactVisibleUntil: '2026-10-08T23:59:59',
    });

    const studentSectionsResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`,
      { headers: { Cookie: `accessToken=${demoAccessToken}` } },
    );
    const studentSections = (await studentSectionsResponse.json()) as {
      contents: Array<{
        contactVisibleFrom: string | null;
        contactVisibleUntil: string | null;
        id: number;
      }>;
    };

    expect(studentSectionsResponse.status).toBe(200);
    expect(studentSections.contents).toContainEqual(
      expect.objectContaining({
        contactVisibleFrom: '2026-10-01T09:00:00',
        contactVisibleUntil: '2026-10-08T23:59:59',
        id: 1,
      }),
    );
  });

  it('교수 분반 조회에서 담당한 모든 강좌의 분반을 반환한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}?professorId=${demoAdmin.studentNumber}`,
      { headers: { Authorization: `Bearer ${demoAdminAccessToken}` } },
    );
    const body = (await response.json()) as {
      contents: Array<{ code: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.contents.map(section => section.code)).toEqual(
      expect.arrayContaining(['OOP-01', 'WEB-01']),
    );
  });
});
