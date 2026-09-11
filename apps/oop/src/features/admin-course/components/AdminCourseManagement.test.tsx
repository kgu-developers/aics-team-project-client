import { setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
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
      onSectionCreated={async () => undefined}
      professorId={demoAdmin.studentNumber}
    />,
    { wrapper: Wrapper },
  );
}

describe('AdminCourseManagement', () => {
  it('연도·학기·상태를 표시하고 연결 분반 확인 전에는 삭제를 비활성화한다', async () => {
    renderManager();

    expect(await screen.findByText('객체지향 프로그래밍')).toBeInTheDocument();
    expect(screen.getByText('운영 중')).toBeInTheDocument();
    expect(screen.getByText('2학기')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '삭제' })[0]).toBeDisabled();
    expect(
      screen.getAllByText(
        '연결된 분반 여부를 확인할 수 없어 삭제할 수 없습니다.',
      )[0],
    ).toBeInTheDocument();
  });

  it('강좌를 등록한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findByText('객체지향 프로그래밍');

    await user.click(screen.getByRole('button', { name: '강좌 등록' }));
    const dialog = screen.getByRole('dialog', { name: '강좌 등록' });
    await user.type(within(dialog).getByLabelText('강좌명'), '알고리즘');
    await user.click(within(dialog).getByRole('button', { name: '등록' }));

    expect(await screen.findByText('알고리즘')).toBeInTheDocument();
  });

  it('강좌 상세에서 운영 상태를 보관됨으로 수정한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findByText('객체지향 프로그래밍');

    await user.click(
      screen.getAllByRole('button', { name: '상세/수정' })[0]!,
    );
    const dialog = await screen.findByRole('dialog', {
      name: '강좌 상세 및 수정',
    });
    await user.click(within(dialog).getByRole('button', { name: '운영 상태' }));
    await user.click(screen.getByRole('option', { name: '보관됨' }));
    await user.click(within(dialog).getByRole('button', { name: '수정 저장' }));

    expect(await screen.findByText('보관됨')).toBeInTheDocument();
  });

  it('강좌에 연결된 분반을 조회하고 등록한다', async () => {
    const user = userEvent.setup();
    renderManager();
    await screen.findByText('객체지향 프로그래밍');

    await user.click(
      screen.getAllByRole('button', { name: '분반 관리' })[0]!,
    );
    const dialog = await screen.findByRole('dialog', {
      name: '객체지향 프로그래밍 분반 관리',
    });
    expect(within(dialog).getByText('OOP-01')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '분반 등록' }));
    await user.type(within(dialog).getByLabelText('분반 코드'), 'OOP-02');
    await user.type(
      within(dialog).getByLabelText('수업 시간'),
      '수요일 3-4교시',
    );
    await user.click(within(dialog).getByRole('button', { name: '등록' }));

    expect(await within(dialog).findByText('OOP-02')).toBeInTheDocument();
  });
});
