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
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { adminMessageKeys } from '~/features/admin-message/queries/adminMessageKeys';
import { useAuthStore } from '~/features/auth/authStore';

import AdminMessagesPage from './AdminMessagesPage';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
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
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
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

function setup(sections = defaultSections) {
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser({
    ...demoAdmin,
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
    await screen.findByRole('option', { name: '현재 분반 하나' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('option', { name: '보관 강좌 분반' }),
  ).not.toBeInTheDocument();
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
  expect(screen.getAllByText('현재 분반 하나')).not.toHaveLength(0);
  await user.click(screen.getByRole('combobox', { name: '분반' }));
  await user.click(
    await screen.findByRole('option', { name: '현재 분반 하나' }),
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
  await user.click(await screen.findByRole('option', { name: '현재 분반 둘' }));
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
