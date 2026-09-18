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
} from 'vitest';

import AdminCourseManagement from './AdminCourseManagement';

import {
  issueMockSession,
  mockSessionResponseHeaders,
} from '~/mocks/authSession';
import { resetAdminCoursesMockData } from '~/mocks/data/adminCourses';
import { resetAdminSectionsMockData } from '~/mocks/data/adminSections';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoAccessToken,
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminSectionHandlers } from '~/mocks/handlers/adminSections';
import {
  adminStudentTeamHandlers,
  resetAdminStudentTeamMockState,
} from '~/mocks/handlers/adminStudentTeams';
import { sectionHandlers } from '~/mocks/handlers/section';

const server = setupServer(
  ...adminCourseHandlers,
  ...adminSectionHandlers,
  ...adminStudentTeamHandlers,
  ...sectionHandlers,
);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetAdminCoursesMockData();
  resetAdminSectionsMockData();
  resetAdminStudentTeamMockState();
  mockSessionResponseHeaders(
    issueMockSession(
      demoUserAccounts.find(
        account => account.user.studentNumber === demoAdmin.studentNumber,
      )!,
    ),
  );
  setApiAccessToken(demoAdminAccessToken);
});
afterEach(() => {
  server.resetHandlers();
  queryClients.splice(0).forEach(queryClient => queryClient.clear());
  setApiAccessToken(null);
});
afterAll(() => server.close());

function renderManager() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  queryClients.push(queryClient);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <ToastViewport />
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }

  return render(
    <AdminCourseManagement
      onSectionCreated={async () => true}
      professorId={demoAdmin.studentNumber}
    />,
    { wrapper: Wrapper },
  );
}

describe('AdminCourseManagement', () => {
  it('분반 관리에서 조교 관리와 조교 목록을 표시한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getAllByRole('button', { name: '분반 관리' })[0]!);
    const sectionDialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
    expect(
      await within(sectionDialog).findByText('등록된 조교가 없습니다.'),
    ).toBeInTheDocument();
    expect(
      within(sectionDialog).getByRole('button', { name: '조교 등록' }),
    ).toBeInTheDocument();
  });

  it('조교를 등록하고 수정한 뒤 현재 분반에서만 제외할 수 있다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getAllByRole('button', { name: '분반 관리' })[0]!);
    const sectionDialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
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
    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getAllByRole('button', { name: '분반 관리' })[0]!);
    const sectionDialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
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

  it('연도·학기·상태를 표시하고 모든 상태의 강좌 삭제를 허용한다', async () => {
    renderManager();

    expect(
      (await screen.findAllByText('객체지향 프로그래밍')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('운영 중').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2학기').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '삭제' })[0]).toBeEnabled();
  });

  it('강좌를 등록한다', async () => {
    const user = userEvent.setup();
    renderManager();
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
    renderManager();
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

  it('강좌 상세에서 운영 상태를 보관됨으로 수정한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getAllByRole('button', { name: '상세/수정' })[0]!);
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

  it('강좌에 연결된 분반을 조회하고 등록한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getAllByRole('button', { name: '분반 관리' })[0]!);
    const dialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
    expect(within(dialog).getByText('OOP-01')).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: '분반 정보 수정' }),
    );
    const settingsDialog = await screen.findByRole('dialog', {
      name: '분반 정보 수정',
    });
    expect(settingsDialog).toBeInTheDocument();
    await user.click(
      within(settingsDialog).getByRole('button', { name: '취소' }),
    );

    await user.click(within(dialog).getByRole('button', { name: '분반 등록' }));
    await user.type(
      within(dialog).getByRole('textbox', { name: /분반 코드/ }),
      'OOP-02',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: /수업 시간/ }),
      '수요일 3-4교시',
    );
    await user.click(within(dialog).getByRole('button', { name: '등록' }));

    expect(await within(dialog).findByText('OOP-02')).toBeInTheDocument();
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

    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');
    await user.click(screen.getAllByRole('button', { name: '분반 관리' })[0]!);
    const sectionDialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
    await user.click(
      within(sectionDialog).getByRole('button', { name: '분반 정보 수정' }),
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
      within(settingsDialog).getByRole('combobox', { name: '공개 시작' }),
    ).toBeDisabled();
    expect(
      within(settingsDialog).getByRole('combobox', { name: '공개 종료' }),
    ).toBeDisabled();

    resolveSectionUpdate?.();
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: '분반 정보 수정' }),
      ).not.toBeInTheDocument();
    });
  });

  it('분반 설정에서 삭제 확인 후 목록에서 제거한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findAllByText('객체지향 프로그래밍');

    await user.click(screen.getAllByRole('button', { name: '분반 관리' })[0]!);
    const sectionDialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
    await user.click(
      within(sectionDialog).getByRole('button', { name: '분반 정보 수정' }),
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
        within(sectionDialog).queryByText('OOP-01'),
      ).not.toBeInTheDocument();
    });
  });

  it('운영 중 강좌도 삭제 확인 후 목록에서 제거한다', async () => {
    const user = userEvent.setup();
    renderManager();
    const row = await screen.findByRole('row', {
      name: /객체지향 프로그래밍 2026 2학기 운영 중/,
    });
    await user.click(within(row).getByRole('button', { name: '삭제' }));

    const dialog = await screen.findByRole('dialog', {
      name: '강좌 삭제 확인',
    });
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(
        screen.queryByRole('row', {
          name: /객체지향 프로그래밍 2026 2학기 운영 중/,
        }),
      ).not.toBeInTheDocument();
    });
  });
});
