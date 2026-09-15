import { File as NodeFile } from 'node:buffer';

import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
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
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { AdminPreSurveyResponses } from './AdminPreSurveyResponses';
import AdminProfilePage from './AdminProfilePage';
import AdminCourseOperations from '../admin-course/AdminCourseOperations';

import {
  mockSessionResponseHeaders,
  issueMockSession,
} from '~/mocks/authSession';
import { resetAdminCoursesMockData } from '~/mocks/data/adminCourses';
import { resetAdminProfileMockData } from '~/mocks/data/adminProfile';
import { resetAdminSectionsMockData } from '~/mocks/data/adminSections';
import { adminStudentsFixture } from '~/mocks/data/adminStudentTeams';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminProfileHandlers } from '~/mocks/handlers/adminProfile';
import { adminSectionHandlers } from '~/mocks/handlers/adminSections';
import {
  adminStudentTeamHandlers,
  resetAdminStudentTeamMockState,
} from '~/mocks/handlers/adminStudentTeams';
import { authHandlers, resetDemoPasswordState } from '~/mocks/handlers/auth';

const demoSectionStudentCount = adminStudentsFixture.filter(
  student => student.sectionId === 'oop-2026-2-01',
).length;

const server = setupServer(
  ...adminCourseHandlers,
  ...adminSectionHandlers,
  ...adminProfileHandlers,
  ...authHandlers,
  ...adminStudentTeamHandlers,
);
const queryClients: QueryClient[] = [];
const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);
const originalCreateObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
);
const originalRevokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
);

let NativeFormData: typeof FormData;
beforeAll(async () => {
  NativeFormData = (
    await new Response('', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).formData()
  ).constructor as typeof FormData;
  server.listen({ onUnhandledRequest: 'error' });

  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.open = false;
    },
  });
});
beforeEach(() => {
  resetAdminCoursesMockData();
  resetAdminSectionsMockData();
  // jsdom File/FormData cannot be serialized by Node's Request used by MSW.
  vi.stubGlobal('File', NodeFile);
  vi.stubGlobal('FormData', NativeFormData);
  resetAdminProfileMockData();
  resetAdminStudentTeamMockState();
  resetDemoPasswordState();
  resetAdminStudentTeamMockState();
  mockSessionResponseHeaders(
    issueMockSession(
      demoUserAccounts.find(
        account => account.user.studentNumber === demoAdmin.studentNumber,
      )!,
    ),
  );
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser(demoAdmin);
});
afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
  queryClients.splice(0).forEach(client => client.clear());
  resetDemoPasswordState();
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
  setApiAccessToken(null);
  useAuthStore.getState().clearSession();

  if (originalCreateObjectUrlDescriptor) {
    Object.defineProperty(URL, 'createObjectURL', {
      ...originalCreateObjectUrlDescriptor,
    });
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL');
  }
  if (originalRevokeObjectUrlDescriptor) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      ...originalRevokeObjectUrlDescriptor,
    });
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  }
});
afterAll(() => {
  server.close();

  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      ...originalDialogShowModalDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      ...originalDialogCloseDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });

  queryClients.push(queryClient);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastViewport>{children}</ToastViewport>
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }

  return {
    ...render(
      <>
        <AdminProfilePage />
        <AdminCourseOperations />
      </>,
      { wrapper: Wrapper },
    ),
    queryClient,
  };
}

describe('AdminProfilePage', () => {
  it('비밀번호 변경 Dialog에서 현재 비밀번호를 검증하고 저장한다', async () => {
    const user = userEvent.setup();
    const { queryClient } = renderPage();
    queryClient.setQueryData(['private-data'], 'existing');

    await user.click(screen.getByRole('button', { name: '비밀번호 변경' }));
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' });

    await user.click(
      within(dialog).getByRole('button', { name: '비밀번호 변경' }),
    );
    expect(
      await within(dialog).findByText('현재 비밀번호를 입력해 주세요.'),
    ).toBeInTheDocument();

    await user.type(
      within(dialog).getByLabelText('현재 비밀번호', { exact: false }),
      'oop-admin',
    );
    await user.type(
      within(dialog).getByLabelText(/^새 비밀번호(?! 확인)/),
      'oop-admin2',
    );
    await user.type(
      within(dialog).getByLabelText('새 비밀번호 확인', { exact: false }),
      'oop-admin2',
    );
    await user.click(
      within(dialog).getByRole('button', { name: '비밀번호 변경' }),
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: '비밀번호 변경' }),
      ).not.toBeInTheDocument(),
    );
    expect(
      await screen.findByText('비밀번호를 변경했어요. 다시 로그인해 주세요.'),
    ).toBeInTheDocument();
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
  });

  it('로그아웃하면 관리자 세션을 정리한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    await waitFor(() => {
      expect(useAuthStore.getState().currentUser).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  it('로그아웃 실패를 표시하고 세션과 캐시를 유지하며 재시도 성공 시 정리한다', async () => {
    let failed = true;
    server.use(
      http.post(`${API_BASE_URL}${ENDPOINTS.AUTH.LOGOUT}`, () =>
        failed
          ? HttpResponse.json({}, { status: 503 })
          : new HttpResponse(null, { status: 204 }),
      ),
    );
    const { queryClient } = renderPage();
    queryClient.setQueryData(['private-data'], 'preserved');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(
      await screen.findByText(
        /로그아웃하지 못했습니다. 로그인 상태가 유지됩니다./,
      ),
    ).toHaveAttribute('role', 'alert');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().currentUser).toEqual(demoAdmin);
    expect(queryClient.getQueryData(['private-data'])).toBe('preserved');
    failed = false;
    await user.click(
      screen.getByRole('button', { name: '로그아웃 다시 시도' }),
    );
    await waitFor(() =>
      expect(useAuthStore.getState().isAuthenticated).toBe(false),
    );
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined();
    expect(
      screen.queryByText(/로그아웃하지 못했습니다/),
    ).not.toBeInTheDocument();
  });

  it('이름과 이메일은 읽기 전용으로 표시한다', () => {
    renderPage();

    expect(screen.getByLabelText('이름')).toBeDisabled();
    expect(screen.getByLabelText('이메일')).toBeDisabled();
  });

  it('수강생 명단 Excel 파일을 미리보기로 검증하고 반영할 수 있다', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderPage();

    await user.click(
      screen.getByRole('button', { name: '학생 명단 파일 선택' }),
    );
    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput) throw new Error('파일 선택 input을 찾을 수 없습니다.');

    await user.upload(fileInput, new File(['not excel'], 'students.txt'));
    const excelFile = new File(['excel data'], '1151.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(fileInput, excelFile);
    await user.click(screen.getByRole('button', { name: '미리보기' }));
    expect(
      await screen.findByText(
        `전체 ${demoSectionStudentCount}건`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `중복 ${demoSectionStudentCount}건`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '반영하기' })).toBeEnabled();
  });

  it('수강생 명단을 반영하면 분반별 업로드 현황을 최신 파일로 갱신한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: '학생 명단 파일 선택' }),
    );
    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput) throw new Error('파일 선택 input을 찾을 수 없습니다.');

    await user.upload(fileInput, new File(['excel data'], 'students-01.xlsx'));
    await user.click(screen.getByRole('button', { name: '미리보기' }));
    await user.click(await screen.findByRole('button', { name: '반영하기' }));

    expect(
      await screen.findByText(/^students-01\.xlsx · /),
    ).toBeInTheDocument();
    expect(screen.getAllByText('파일 없음')).toHaveLength(1);
  });

  it('팀 구성 명단을 반영하면 팀 명단 현황만 최신 파일로 갱신한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: '팀 구성 명단 파일 선택' }),
    );
    const fileInput = document.querySelector<HTMLInputElement>(
      'dialog[open] input[type="file"]',
    );

    if (!fileInput) throw new Error('파일 선택 input을 찾을 수 없습니다.');

    await user.upload(fileInput, new File(['excel data'], 'teams-01.xlsx'));
    await user.click(screen.getByRole('button', { name: '미리보기' }));
    await user.click(await screen.findByRole('button', { name: '반영하기' }));

    expect(await screen.findByText(/^teams-01\.xlsx · /)).toBeInTheDocument();
    expect(screen.getAllByText('파일 없음')).toHaveLength(1);
  });

  it('명단 반영 현황을 조회하지 못하면 오류 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ROSTER_IMPORT_STATUS(':sectionId')}`,
        () =>
          HttpResponse.json(
            { code: 'ROSTER_IMPORT_STATUS_LOOKUP_FAILED' },
            { status: 500 },
          ),
      ),
    );
    renderPage();

    expect(
      await screen.findAllByText('업로드 현황을 불러오지 못했습니다.'),
    ).toHaveLength(2);
  });

  it('파일명이 없는 기존 반영 이력은 파일 없음으로 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ROSTER_IMPORT_STATUS(':sectionId')}`,
        () =>
          HttpResponse.json({
            studentRoster: null,
            teamRoster: {
              appliedAt: '2026-09-09T07:00:00',
              fileName: null,
            },
          }),
      ),
    );
    renderPage();

    expect(await screen.findAllByText('파일 없음')).toHaveLength(2);
  });

  it('업로드 모달을 닫으면 미리보기 상태를 초기화한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('button', { name: '학생 명단 파일 선택' }),
    );
    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]');

    if (!fileInput) throw new Error('파일 선택 input을 찾을 수 없습니다.');

    await user.upload(fileInput, new File(['excel data'], '1151.xlsx'));
    await user.click(screen.getByRole('button', { name: '미리보기' }));
    expect(
      await screen.findByText(
        `전체 ${demoSectionStudentCount}건`,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));
    await user.click(
      screen.getByRole('button', { name: '학생 명단 파일 선택' }),
    );

    expect(screen.queryByText(/^전체 \d+건$/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '반영하기' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '미리보기' })).toBeDisabled();
    expect(
      document.querySelector<HTMLInputElement>(
        'dialog[open] input[type="file"]',
      )?.files,
    ).toHaveLength(0);
  });

  it('담당 분반이 없으면 데이터 업로드를 막고 이유를 표시한다', () => {
    useAuthStore.setState({ currentUser: { ...demoAdmin, sections: [] } });
    renderPage();

    expect(
      screen.getByText('담당 분반이 없어 명단 파일을 선택할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('담당 분반이 없어 사전 정보를 조회할 수 없습니다.'),
    ).toBeInTheDocument();
  });

  it('사전 정보 내역에서 계약된 응답 항목과 이름을 표시한다', async () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: '사전 정보 내역' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        '팀 구성 Excel 업로드와 실제 저장은 서버 연동 후 지원합니다.',
      ),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        '응답 수: 2명 · 미응답 학생은 현재 API 응답에 포함되지 않습니다.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '학번' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '이름' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '희망 역할' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '주제 의견' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '기타 의견' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '제출일' }),
    ).toBeInTheDocument();
    expect(screen.getByText('20260001')).toBeInTheDocument();
    expect(screen.getByText('김객체')).toBeInTheDocument();
    expect(screen.getByText('이프로')).toBeInTheDocument();
  });

  it('선택한 분반의 사전조사 응답 Excel 파일을 다운로드한다', async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.fn(() => 'blob:pre-survey-responses');
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('객체지향프로그래밍 01-사전조사.xlsx');
        expect(this.href).toBe('blob:pre-survey-responses');
      });

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });

    renderPage();
    await user.click(
      await screen.findByRole('button', { name: '사전 정보 다운로드' }),
    );

    await waitFor(() => expect(anchorClick).toHaveBeenCalledOnce());
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:pre-survey-responses');
    expect(
      screen.getByText('사전조사 응답 Excel 파일을 다운로드했어요.'),
    ).toBeInTheDocument();

    anchorClick.mockRestore();
  });

  it('사전조사 Excel 다운로드가 거부되면 오류를 안내한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES_DOWNLOAD(':sectionId')}`,
        () => HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }),
      ),
    );
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '사전 정보 다운로드' }),
    );

    expect(
      await screen.findByText(
        '사전조사 응답 Excel 파일을 다운로드하지 못했습니다. 다시 시도해 주세요.',
      ),
    ).toBeInTheDocument();
  });

  it('희망 역할 응답이 배열이 아니어도 목록을 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES(':sectionId')}`,
        () =>
          HttpResponse.json({
            contents: [
              {
                etcOpinion: '기타 의견',
                id: 3,
                preferredRoles: null,
                submittedAt: '2026-09-07 12:00',
                topicOpinion: '주제 의견',
                userId: '20260004',
                userName: '런타임 가드 테스트',
              },
            ],
          }),
      ),
    );
    renderPage();

    expect(await screen.findByText('런타임 가드 테스트')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('사전 정보 조회가 실패하면 오류를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES(':sectionId')}`,
        () =>
          HttpResponse.json(
            { code: 'PRE_SURVEY_LOOKUP_FAILED' },
            { status: 500 },
          ),
      ),
    );
    renderPage();

    expect(
      await screen.findByText(
        '사전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ),
    ).toHaveAttribute('role', 'alert');
  });

  it('분반 목록이 나중에 들어오면 첫 분반의 사전 정보를 표시한다', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, retryDelay: 0 } },
    });
    queryClients.push(queryClient);
    const { rerender } = render(
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminPreSurveyResponses sections={[]} />
        </QueryClientProvider>
      </AstryxThemeProvider>,
    );

    expect(
      screen.getByText('담당 분반이 없어 사전 정보를 조회할 수 없습니다.'),
    ).toBeInTheDocument();

    rerender(
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AdminPreSurveyResponses
            sections={[{ code: 'OOP-01', id: 'oop-2026-2-01', name: '분반 1' }]}
          />
        </QueryClientProvider>
      </AstryxThemeProvider>,
    );

    expect(
      await screen.findByText(
        '응답 수: 2명 · 미응답 학생은 현재 API 응답에 포함되지 않습니다.',
      ),
    ).toBeInTheDocument();
  });
});
