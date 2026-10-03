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
import ExcelJS from 'exceljs';
import { delay, http, HttpResponse } from 'msw';
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
import { appliedAdminRosterImportStatusFixture } from '~/mocks/data/adminRosterImportStatus';
import {
  createAdminSection,
  getAdminSectionsByCourseId,
  resetAdminSectionsMockData,
} from '~/mocks/data/adminSections';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoAccessToken,
  demoPresentationProfessorAccessToken,
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminProfileHandlers } from '~/mocks/handlers/adminProfile';
import { adminSectionArtifactHandlers } from '~/mocks/handlers/adminSectionArtifacts';
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
  ...adminSectionArtifactHandlers,
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
  const studentTeamRoute = createRoute({
    component: () => <div>수강생·팀 관리 페이지</div>,
    getParentRoute: () => root,
    path: '/admin/student-team',
    validateSearch: (
      search: Record<string, unknown>,
    ): { sectionId?: number } => ({
      sectionId:
        typeof search.sectionId === 'number' ? search.sectionId : undefined,
    }),
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: root.addChildren([
      sectionsRoute.addChildren([listRoute, detailRoute]),
      studentTeamRoute,
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

    // The default ACTIVE filter hides the archived course with the same name.
    const row = await screen.findByRole('row', {
      name: '객체지향 프로그래밍 강좌 상세 보기',
    });
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
    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ sectionId: 1 }),
    );
  });

  it('운영 중 강좌를 기본으로 표시하고 전체 조회에서는 최신 학기부터 정렬한다', async () => {
    const user = userEvent.setup();
    renderAt('/admin/sections');

    expect(await screen.findByText('객체지향 프로그래밍')).toBeInTheDocument();
    expect(screen.queryByText('웹 프로그래밍')).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: '상태' }));
    await user.click(screen.getByRole('option', { name: '전체 상태' }));

    const rows = await screen.findAllByRole('row', {
      name: /강좌 상세 보기/,
    });
    expect(within(rows[0]!).getByText('웹 프로그래밍')).toBeInTheDocument();
    expect(within(rows[0]!).getByText('2027')).toBeInTheDocument();
    expect(within(rows[1]!).getByText('2026')).toBeInTheDocument();
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
    const year = within(dialog).getByRole('textbox', { name: /연도/ });
    await user.clear(year);
    await user.type(year, '2027');
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
  it('여러 분반 강좌는 기준 분반을 선택하기 전 첫 분반의 운영 현황을 표시하지 않는다', async () => {
    const user = userEvent.setup();
    createAdminSection({
      capacity: 35,
      classTime: '화요일 3-4교시',
      code: 'OOP-02',
      courseId: 1,
      professorId: demoAdmin.studentNumber,
    });

    const router = renderAt('/admin/sections/1');

    const selector = await screen.findByRole('combobox', {
      name: '화면 기준 분반',
    });
    expect(selector).toHaveValue('');
    expect(
      screen.getByText('분반을 선택하면 해당 분반의 운영 현황을 표시합니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '분반 산출물 현황' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '데이터 업로드' }),
    ).not.toBeInTheDocument();

    await user.click(selector);
    await user.click(screen.getByRole('option', { name: 'OOP-02 (OOP-02)' }));

    expect(
      await screen.findByRole('heading', { name: '데이터 업로드' }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toMatchObject({ sectionId: 3 });
  });

  it('분반 목록을 불러오는 동안에는 운영 패널의 빈 상태를 보여 주지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}`, async () => {
        await delay(500);
        return HttpResponse.json({ contents: getAdminSectionsByCourseId(1) });
      }),
    );

    renderAt('/admin/sections/1');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: '객체지향 프로그래밍',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('연결된 분반을 불러오는 중입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '데이터 업로드' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '분반 산출물 현황' }),
    ).not.toBeInTheDocument();
  });

  it('명단 업로드 상태를 불러오지 못해도 미업로드로 판단해 영역 순서를 바꾸지 않는다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ROSTER_IMPORT_STATUS('1')}`,
        () => HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
      ),
    );

    renderAt('/admin/sections/1');

    expect(
      await screen.findByText(
        '명단 업로드 상태를 확인하지 못했습니다. 기본 영역 순서로 표시되며, 잠시 후 다시 확인해 주세요.',
      ),
    ).toBeInTheDocument();

    const operationHeadings = screen
      .getAllByRole('heading', { level: 2 })
      .map(heading => heading.textContent);
    expect(operationHeadings).toEqual([
      '분반',
      '사전 정보 내역',
      '데이터 업로드',
      '분반 산출물 현황',
    ]);
  });

  it('기준 분반에 학생·팀 명단이 모두 적용되면 산출물 현황을 먼저 보여 준다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ROSTER_IMPORT_STATUS(1)}`,
        () => HttpResponse.json(appliedAdminRosterImportStatusFixture),
      ),
    );

    renderAt('/admin/sections/1');

    expect(
      await screen.findByText(
        appliedAdminRosterImportStatusFixture.studentRoster.fileName,
        { exact: false },
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        appliedAdminRosterImportStatusFixture.teamRoster.fileName,
        { exact: false },
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      const operationHeadings = screen
        .getAllByRole('heading', { level: 2 })
        .map(heading => heading.textContent);

      expect(operationHeadings).toEqual([
        '분반',
        '분반 산출물 현황',
        '사전 정보 내역',
        '데이터 업로드',
      ]);
    });
  });

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
      await screen.findByRole('heading', { name: '사전 정보 내역' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '사전 정보 다운로드' }),
    ).toBeEnabled();
    expect(
      await screen.findByRole('heading', { name: '분반 산출물 현황' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: '산출물 분반' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /집계 기준일/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Excel의 단계별 제출 현황에서 상태는 선택한 기준일의 상태가 아니라 다운로드 시점의 최신 상태입니다.',
      ),
    ).toBeInTheDocument();
    const artifactTable = await screen.findByRole('table', {
      name: '분반 산출물 현황',
    });
    expect(
      within(artifactTable).getByRole('row', {
        name: /1팀.*20260001 김가가.*6.*4.*3.*1/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '산출물 현황 다운로드' }),
    ).toBeEnabled();
  });

  it('사전 정보 패널에는 현재 강좌 조회로 불러온 분반만 전달한다', async () => {
    useAuthStore.setState({
      currentUser: {
        ...demoAdmin,
        sections: [
          {
            ...demoAdmin.sections[0]!,
            code: '다른 강좌 분반',
            id: '999',
            name: '다른 강좌 분반',
          },
        ],
      },
    });

    renderAt('/admin/sections/1');

    const sectionSelector = await screen.findByRole('combobox', {
      name: '분반',
    });
    expect(sectionSelector).toHaveTextContent('OOP-01');
    expect(sectionSelector).not.toHaveTextContent('다른 강좌 분반');
  });

  it('분반의 수강생 관리 동작은 해당 분반이 선택된 관리 페이지로 이동한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/admin/sections/1');
    const row = await screen.findByRole('row', { name: 'OOP-01 분반 설정' });

    await user.click(within(row).getByRole('button', { name: '수강생 관리' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin/student-team');
      expect(router.state.location.search).toEqual({ sectionId: 1 });
    });
    expect(screen.getByText('수강생·팀 관리 페이지')).toBeInTheDocument();
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
    expect(
      within(settingsDialog).getByRole('heading', { name: '온보딩 기간' }),
    ).toBeInTheDocument();
    expect(
      within(settingsDialog).getByText(
        '시작일 00:00부터 팀원이 공개되고, 설정한 시작 시각부터 연락처 공개와 팀장 선정을 진행할 수 있습니다.',
      ),
    ).toBeInTheDocument();
    expect(within(settingsDialog).queryByText(/선택/)).not.toBeInTheDocument();
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
        name: '온보딩 시작 날짜',
      }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('textbox', {
        name: '온보딩 시작 시간',
      }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('combobox', {
        name: '온보딩 종료 날짜',
      }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('textbox', {
        name: '온보딩 종료 시간',
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
    expect(await screen.findByText('표시할 강좌가 없습니다.')).toBeVisible();
    await user.click(screen.getByRole('combobox', { name: '상태' }));
    await user.click(screen.getByRole('option', { name: '전체 상태' }));
    await screen.findByRole('row', { name: '웹 프로그래밍 강좌 상세 보기' });
    // Only the 2025 archived course of the same name remains.
    expect(
      screen.getAllByRole('row', {
        name: '객체지향 프로그래밍 강좌 상세 보기',
      }),
    ).toHaveLength(1);
  });
});

describe('admin section API contract', () => {
  it('산출물 요약은 선택한 기준일을 쿼리로 전달한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ARTIFACT_SUMMARY('1')}?asOf=2026-09-15`,
      { headers: { Authorization: `Bearer ${demoAdminAccessToken}` } },
    );
    const body = (await response.json()) as {
      asOf: string;
      contents: Array<{ teamName: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.asOf).toBe('2026-09-15');
    expect(body.contents).toEqual(
      expect.arrayContaining([expect.objectContaining({ teamName: '1팀' })]),
    );
  });

  it('산출물 다운로드는 두 시트가 담긴 Excel 파일을 반환한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ARTIFACT_DOWNLOAD('1')}?asOf=2026-09-15`,
      { headers: { Authorization: `Bearer ${demoAdminAccessToken}` } },
    );
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(workbook.worksheets.map(sheet => sheet.name)).toEqual([
      '팀별 요약',
      '단계별 제출 현황',
    ]);
    expect(
      workbook.getWorksheet('단계별 제출 현황')?.getCell(1, 13).value,
    ).toBe('전체 파일 용량');
  });

  it('담당하지 않는 분반의 산출물 조회는 403으로 처리한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ARTIFACT_SUMMARY('1')}?asOf=2026-09-15`,
      {
        headers: {
          Authorization: `Bearer ${demoPresentationProfessorAccessToken}`,
        },
      },
    );

    expect(response.status).toBe(403);
  });

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
