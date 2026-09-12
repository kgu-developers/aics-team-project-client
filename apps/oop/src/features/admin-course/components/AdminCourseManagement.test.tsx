import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  demoUserAccounts,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import { adminSectionHandlers } from '~/mocks/handlers/adminSections';

const server = setupServer(...adminCourseHandlers, ...adminSectionHandlers);
const queryClients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetAdminCoursesMockData();
  resetAdminSectionsMockData();
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
  it('연도·학기·상태를 표시하고 운영 중 강좌의 삭제를 비활성화한다', async () => {
    renderManager();

    expect(
      (await screen.findAllByText('객체지향 프로그래밍')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('운영 중').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2학기').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '삭제' })[0]).toBeDisabled();
    expect(
      screen.getAllByText(
        '운영을 종료할 때는 상태를 보관됨으로 변경해 주세요.',
      )[0],
    ).toBeInTheDocument();
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

  it('임시 저장 강좌는 삭제 확인 후 목록에서 제거한다', async () => {
    const user = userEvent.setup();
    renderManager();
    const courseName = await screen.findByText('웹 프로그래밍');
    const row = courseName.closest('tr');

    expect(row).not.toBeNull();
    await user.click(within(row!).getByRole('button', { name: '삭제' }));

    const dialog = screen.getByRole('dialog', { name: '강좌 삭제 확인' });
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(screen.queryByText('웹 프로그래밍')).not.toBeInTheDocument();
    });
  });
});
