import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import type { AdminMessagePage, CurrentUser } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { adminMessageKeys } from '~/features/admin-message/queries/adminMessageKeys';
import { useAuthStore } from '~/features/auth/authStore';

import AdminMessagesPage from './AdminMessagesPage';

import { resetMockSessionState } from '~/mocks/authSession';
import { resetAdminCoursesMockData } from '~/mocks/data/adminCourses';
import {
  demoAdmin,
  demoAdminAccessToken,
  demoNoticeProfessor,
  demoNoticeProfessorAccessToken,
} from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';

// Section teams feed the dependent team filter; the list itself is enough here.
const server = setupServer(
  ...adminCourseHandlers,
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAMS(':sectionId')}`,
    () =>
      HttpResponse.json({
        contents: [
          {
            createdAt: '2026-09-08T15:15:06.656Z',
            id: 7,
            kickoffRule: null,
            meetingSchedule: null,
            name: '7팀',
            status: 'CONFIRMED',
          },
        ],
      }),
  ),
);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetAdminCoursesMockData();
  resetMockSessionState();
  sessionStorage.clear();
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  sessionStorage.clear();
  useAuthStore.getState().clearSession();
  setApiAccessToken(null);
});
afterAll(() => server.close());

const defaultSections: CurrentUser['sections'] = [
  {
    ...demoAdmin.sections[0]!,
    code: '현재 분반 하나',
    id: '1',
    name: '과거 분반 하나',
  },
  {
    ...demoAdmin.sections[0]!,
    code: '현재 분반 둘',
    id: '2',
    name: '과거 분반 둘',
  },
];

function setup(
  sections = defaultSections,
  currentUser: CurrentUser = demoAdmin,
  accessToken = demoAdminAccessToken,
) {
  useAuthStore.getState().setAccessToken(accessToken);
  useAuthStore.getState().setCurrentUser({
    ...currentUser,
    sections,
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ['/admin/messages'] }),
  });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterContextProvider router={router}>
          <AdminMessagesPage />
        </RouterContextProvider>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return client;
}

it('담당 교수는 분반 전체 팀에 일반 메시지를 한 번에 보낸다', async () => {
  const posted: unknown[] = [];
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, () =>
      HttpResponse.json(messagePage(0, 10, 0)),
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_SECTION('1')}`,
      async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json({ sentCount: 3 }, { status: 201 });
      },
    ),
  );
  setup(
    demoNoticeProfessor.sections,
    demoNoticeProfessor,
    demoNoticeProfessorAccessToken,
  );
  const user = userEvent.setup();

  await user.click(
    await screen.findByRole('button', { name: '일반 메시지 보내기' }),
  );
  const panel = screen.getByRole('complementary', {
    name: '일반 메시지 작성 패널',
  });
  await user.click(within(panel).getByRole('combobox', { name: '팀' }));
  await user.click(await screen.findByRole('option', { name: '전체 팀' }));
  await user.type(
    within(panel).getByRole('textbox', { name: '일반 메시지 내용' }),
    '전체 팀 안내',
  );
  await user.click(within(panel).getByRole('button', { name: '보내기' }));
  await user.click(
    await screen.findByRole('button', { name: '전체 팀에 보내기' }),
  );

  expect(
    await within(panel).findByText(
      '전체 3개 팀에 일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
    ),
  ).toBeVisible();
  expect(posted).toEqual([{ message: '전체 팀 안내' }]);
});

function messagePage(
  page: number,
  size: number,
  total: number,
  section = 'all',
): AdminMessagePage {
  return {
    contents: Array.from(
      { length: Math.max(0, Math.min(size, total - page * size)) },
      (_, index) => ({
        id: page * size + index + 1,
        threadId: 1,
        sectionId: 1,
        sectionName: '분반 하나',
        teamId: 1,
        teamName: '1팀',
        senderId: 'student',
        senderName: '학생',
        message: `${section} 쪽지 ${page * size + index + 1}`,
        createdAt: '2026-09-01T10:00:00Z',
        relatedType: 'GENERAL',
        important: false,
        read: false,
      }),
    ),
    unreadCount: total,
    pageable: {
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      isEnd: (page + 1) * size >= total,
    },
  };
}

function paginationButtons() {
  return within(screen.getByRole('navigation')).getAllByRole('button');
}

it('운영 분반 조회 실패 중에는 독립적으로 조회된 쪽지함을 노출하지 않는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`, () =>
      HttpResponse.json({ code: 'INTERNAL_SERVER_ERROR' }, { status: 500 }),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, () =>
      HttpResponse.json(messagePage(0, 10, 1)),
    ),
  );

  setup();

  expect(
    await screen.findByText('운영 중인 분반을 불러오지 못했습니다.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('all 쪽지 1')).not.toBeInTheDocument();
  expect(screen.queryByText('미확인 1건')).not.toBeInTheDocument();
});

it('분반 필터에서 보관 강좌의 운영 분반을 제외한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, () =>
      HttpResponse.json(messagePage(0, 10, 0)),
    ),
  );
  setup([
    defaultSections[0]!,
    {
      ...defaultSections[1]!,
      code: '보관 강좌 분반',
      courseId: 3,
      status: 'ACTIVE',
    },
  ]);

  const sectionFilter = await screen.findByRole('combobox', { name: '분반' });
  await waitFor(() => expect(sectionFilter).toBeEnabled());
  await userEvent.click(sectionFilter);

  expect(
    await screen.findByRole('option', {
      name: '현재 분반 하나 · 월요일 1-2교시',
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: '보관 강좌 분반' }),
  ).not.toBeInTheDocument();
});

it('쪽지 목록은 분반 옆에 유형을 표시하고 읽지 않은 행만 파란 점을 표시한다', async () => {
  const page = messagePage(0, 10, 2);
  const firstMessage = page.contents[0]!;
  const secondMessage = page.contents[1]!;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, () =>
      HttpResponse.json({
        ...page,
        contents: [
          {
            ...firstMessage,
            relatedType: 'PROPOSAL',
            read: false,
          },
          {
            ...secondMessage,
            relatedType: 'MID_REPORT',
            read: true,
          },
        ],
      }),
    ),
  );

  setup();

  await screen.findByRole('columnheader', { name: '읽음 상태' });
  await screen.findByRole('columnheader', { name: '분반' });
  expect(
    screen.getAllByRole('columnheader').map(header => header.textContent),
  ).toEqual(['', '분반', '팀', '내용', '발신자']);
  expect(
    screen.getAllByText('현재 분반 하나 · 월요일 1-2교시'),
  ).not.toHaveLength(0);
  expect(screen.getByLabelText('읽지 않음')).toBeInTheDocument();
  expect(screen.getByText('제안서 피드백')).toBeInTheDocument();
  expect(screen.getByText('중간 보고서 피드백')).toBeInTheDocument();
  expect(screen.getByTitle(firstMessage.message)).toBeInTheDocument();
  expect(
    within(screen.getByTitle(firstMessage.message).closest('tr')!).getAllByRole(
      'cell',
    )[0],
  ).toContainElement(screen.getByLabelText('읽지 않음'));
});

it('분반과 팀을 선택해 첫 일반 메시지를 보낸다', async () => {
  const posted: unknown[] = [];
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, () =>
      HttpResponse.json(messagePage(0, 10, 0)),
    ),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
      async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json({
          id: 99,
          threadId: 7,
          senderId: demoAdmin.studentNumber,
          senderName: demoAdmin.name,
          message: '팀 상담 일정을 확인해 주세요.',
          relatedType: 'GENERAL',
          relatedId: null,
          createdAt: '2026-10-12T04:00:00Z',
        });
      },
    ),
  );
  setup();
  const user = userEvent.setup();

  const composeButton = await screen.findByRole('button', {
    name: '일반 메시지 보내기',
  });
  await waitFor(() => expect(composeButton).toBeEnabled());
  await user.click(composeButton);
  const panel = screen.getByRole('complementary', {
    name: '일반 메시지 작성 패널',
  });
  expect(panel).toHaveTextContent(
    '보낸 메시지는 해당 팀의 일반 메시지 대화에 추가됩니다.',
  );
  await user.click(within(panel).getByRole('combobox', { name: '팀' }));
  await user.click(await screen.findByRole('option', { name: '7팀' }));
  await user.type(
    within(panel).getByRole('textbox', { name: '일반 메시지 내용' }),
    '팀 상담 일정을 확인해 주세요.',
  );
  await user.click(within(panel).getByRole('button', { name: '보내기' }));

  expect(
    await within(panel).findByText(
      '일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
    ),
  ).toBeVisible();
  expect(panel).toBeInTheDocument();

  await waitFor(() =>
    expect(posted).toEqual([
      {
        message: '팀 상담 일정을 확인해 주세요.',
        relatedType: 'GENERAL',
      },
    ]),
  );
});

it('작성 패널에서 팀을 바꿔도 기존 팀의 초안을 보존한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, () =>
      HttpResponse.json(messagePage(0, 10, 0)),
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAMS(':sectionId')}`,
      () =>
        HttpResponse.json({
          contents: [
            { id: 7, name: '7팀', status: 'CONFIRMED' },
            { id: 8, name: '8팀', status: 'CONFIRMED' },
          ],
        }),
    ),
  );
  setup();
  const user = userEvent.setup();

  await user.click(
    await screen.findByRole('button', { name: '일반 메시지 보내기' }),
  );
  const panel = screen.getByRole('complementary', {
    name: '일반 메시지 작성 패널',
  });
  const teamSelect = within(panel).getByRole('combobox', { name: '팀' });
  const message = within(panel).getByRole('textbox', {
    name: '일반 메시지 내용',
  });

  await user.click(teamSelect);
  await user.click(await screen.findByRole('option', { name: '7팀' }));
  await user.type(message, '7팀 초안');
  await user.click(teamSelect);
  await user.click(await screen.findByRole('option', { name: '8팀' }));
  expect(message).toHaveValue('');
  await user.type(message, '8팀 초안');
  await user.click(teamSelect);
  await user.click(await screen.findByRole('option', { name: '7팀' }));

  expect(message).toHaveValue('7팀 초안');
});

it('reaches item 11, keeps page caches separate, and resets pages on section/all filters', async () => {
  const requests: Array<{ section: string; page: number; size: number }> = [];
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`,
      ({ request }) => {
        const params = new URL(request.url).searchParams;
        const section = params.get('sectionId') ?? 'all';
        const page = Number(params.get('page'));
        const size = Number(params.get('size'));
        requests.push({ section, page, size });
        return HttpResponse.json(
          messagePage(page, size, section === '2' ? 0 : 11, section),
        );
      },
    ),
  );
  const client = setup();
  const user = userEvent.setup();
  await screen.findByText('all 쪽지 1');
  expect(paginationButtons()[0]).toBeDisabled();
  await user.click(paginationButtons()[1]!);
  await screen.findByText('all 쪽지 11');
  expect(screen.queryByText('all 쪽지 1')).not.toBeInTheDocument();
  expect(paginationButtons()[1]).toBeDisabled();
  expect(
    client.getQueryData<AdminMessagePage>(adminMessageKeys.list(undefined, 0))
      ?.contents[0]?.id,
  ).toBe(1);
  expect(
    client.getQueryData<AdminMessagePage>(adminMessageKeys.list(undefined, 1))
      ?.contents[0]?.id,
  ).toBe(11);
  await user.click(paginationButtons()[0]!);
  await screen.findByText('all 쪽지 1');
  await waitFor(() => expect(paginationButtons()[1]).toBeEnabled());
  await user.click(paginationButtons()[1]!);
  await screen.findByText('all 쪽지 11');
  expect(
    screen.getAllByText('현재 분반 하나 · 월요일 1-2교시'),
  ).not.toHaveLength(0);
  await user.click(screen.getByRole('combobox', { name: '분반' }));
  await user.click(
    await screen.findByRole('option', {
      name: '현재 분반 하나 · 월요일 1-2교시',
    }),
  );
  await screen.findByText('1 쪽지 1');
  expect(requests.filter(row => row.section === '1')).toEqual([
    { section: '1', page: 0, size: 10 },
  ]);
  await user.click(paginationButtons()[1]!);
  await screen.findByText('1 쪽지 11');
  await user.click(screen.getByRole('combobox', { name: '분반' }));
  await user.click(await screen.findByRole('option', { name: '전체 분반' }));
  await screen.findByText('all 쪽지 1');
  expect(paginationButtons()[0]).toBeDisabled();
  await user.click(screen.getByRole('combobox', { name: '분반' }));
  await user.click(
    await screen.findByRole('option', {
      name: '현재 분반 둘 · 월요일 1-2교시',
    }),
  );
  await screen.findByText('쪽지가 없습니다.');
  // Empty mailbox: no pages to move between, so the pagination bar is hidden.
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

it.each([0, 1])(
  'clamps the current page after the response shrinks to %i items',
  async totalAfter => {
    let total = 11;
    const requests: number[] = [];
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`,
        ({ request }) => {
          const page = Number(new URL(request.url).searchParams.get('page'));
          requests.push(page);
          return HttpResponse.json(messagePage(page, 10, total));
        },
      ),
    );
    const client = setup();
    await screen.findByText('all 쪽지 1');
    await userEvent.click(paginationButtons()[1]!);
    await screen.findByText('all 쪽지 11');
    total = totalAfter;
    await act(async () => {
      await client.invalidateQueries({ queryKey: adminMessageKeys.all });
    });
    await screen.findByText(totalAfter ? 'all 쪽지 1' : '쪽지가 없습니다.');
    await waitFor(() => expect(requests).toEqual([0, 1, 1, 0]));
    // 0 or 1 items fit on one page, so the pagination bar is hidden.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  },
);

it('shows a retryable page error and resumes on the same page', async () => {
  let failed = true;
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`,
      ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        return page === 1 && failed
          ? HttpResponse.json({}, { status: 500 })
          : HttpResponse.json(messagePage(page, 10, 11));
      },
    ),
  );
  setup();
  await screen.findByText('all 쪽지 1');
  await userEvent.click(paginationButtons()[1]!);
  await screen.findByText('쪽지함을 불러오지 못했습니다.');
  expect(screen.queryByText('all 쪽지 1')).not.toBeInTheDocument();
  failed = false;
  await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  await screen.findByText('all 쪽지 11');
});
