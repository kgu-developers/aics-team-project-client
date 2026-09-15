import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminTeamMessagesPage from './AdminTeamMessagesPage';

import { teamMessageProfessorId } from '~/mocks/data/teamMessages';
import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminMidReportHandlers } from '~/mocks/handlers/adminMidReports';
import { adminMilestoneSubmissionsHandlers } from '~/mocks/handlers/adminMilestoneSubmissions';
import { adminSectionMilestoneHandlers } from '~/mocks/handlers/adminSectionMilestones';
import { adminStudentTeamHandlers } from '~/mocks/handlers/adminStudentTeams';
import { createTeamMessageHandlers } from '~/mocks/handlers/teamMessages';

const server = setupServer(
  ...adminStudentTeamHandlers,
  ...createTeamMessageHandlers({
    getAuthenticatedUserId: () => teamMessageProfessorId,
  }),
);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  server.events.removeAllListeners();
  setApiAccessToken(null);
  useAuthStore.setState({ accessToken: null, currentUser: null });
});
afterAll(() => server.close());

function renderPage(sectionId = '1') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  clients.push(client);
  setApiAccessToken(demoAdminAccessToken);
  useAuthStore.setState({
    accessToken: demoAdminAccessToken,
    currentUser: {
      ...demoAdmin,
      sections: [{ ...demoAdmin.sections[0]!, id: sectionId }],
    },
  });
  const root = createRootRoute();
  const child = createRoute({
    getParentRoute: () => root,
    path: '/admin/messages/teams/$teamId',
    component: AdminTeamMessagesPage,
  });
  const router = createRouter({
    routeTree: root.addChildren([child]),
    history: createMemoryHistory({
      initialEntries: ['/admin/messages/teams/1'],
    }),
  });
  const requests: string[] = [];
  server.events.on('request:start', ({ request }) =>
    requests.push(new URL(request.url).pathname),
  );
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return requests;
}
const teamPath = new URL(`${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM('1')}`)
  .pathname;

it('sends mid-report feedback with the document ID and preserves the draft on conflict', async () => {
  const posted: unknown[] = [];
  server.use(
    ...adminSectionMilestoneHandlers,
    ...adminMilestoneSubmissionsHandlers,
    ...adminMidReportHandlers,
    http.post(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('1')}`,
      async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json({ code: 'DATA_CONFLICT' }, { status: 409 });
      },
    ),
  );
  renderPage();
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: '중간점검 피드백' }),
  );
  const input = screen.getByRole('textbox', { name: '메시지 내용' });
  await user.type(input, '중간보고서 반영 내용을 확인했습니다.');
  const send = screen.getByRole('button', { name: '메시지 보내기' });
  await waitFor(() => expect(send).toBeEnabled());
  await user.click(send);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    '메시지를 보내지 못했습니다.',
  );
  expect(posted).toEqual([
    {
      message: '중간보고서 반영 내용을 확인했습니다.',
      relatedType: 'MID_REPORT',
      relatedId: 401,
    },
  ]);
  expect(input).toHaveValue('중간보고서 반영 내용을 확인했습니다.');
});

describe('team message access', () => {
  it('blocks an inaccessible section before requesting messages or displaying a composer', async () => {
    const requests = renderPage('other-section');
    await screen.findByText('이 팀에 접근할 수 없습니다.');
    expect(requests).toEqual([teamPath]);
    expect(
      screen.queryByRole('textbox', { name: '메시지 내용' }),
    ).not.toBeInTheDocument();
  });

  it('waits for team lookup, contains failure, and loads messages only after successful retry', async () => {
    let respond!: (response: Response) => void;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM('1')}`,
        () =>
          new Promise<Response>(resolve => {
            respond = resolve;
          }),
      ),
    );
    const requests = renderPage();
    await screen.findByText('팀 정보를 불러오는 중입니다.');
    expect(requests.filter(path => path !== teamPath)).toEqual([]);
    // A non-retried status lets the UI offer an explicit recovery action.
    await waitFor(() => expect(respond).toBeTypeOf('function'));
    respond(HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }));
    await screen.findByText('팀 정보를 불러오지 못했습니다.');
    expect(requests).toEqual([teamPath]);
    expect(
      screen.queryByRole('textbox', { name: '메시지 내용' }),
    ).not.toBeInTheDocument();
    server.resetHandlers();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '팀 정보 다시 시도' }));
    await screen.findByRole('textbox', { name: '메시지 내용' });
    await screen.findByText('제안서의 문제 정의와 구현 범위를 보완해 주세요.');
    expect(requests.some(path => path !== teamPath)).toBe(true);
  });
});

it('formats ISO message creation times in Seoul across midnight', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('1')}`, () =>
      HttpResponse.json({
        contents: [
          {
            id: 710,
            threadId: 10,
            senderId: teamMessageProfessorId,
            senderName: '교수',
            message: '서울 시간 표시',
            createdAt: '2026-09-01T23:30:00Z',
            relatedType: 'GENERAL',
            relatedId: null,
            important: false,
            read: false,
          },
        ],
        pageable: {
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
          isEnd: true,
        },
      }),
    ),
  );
  renderPage();
  expect(await screen.findByText(/2026\.09\.02 08:30/)).toBeVisible();
});
