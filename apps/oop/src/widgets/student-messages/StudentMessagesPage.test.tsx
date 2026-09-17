import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { TeamMessage } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
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
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentMessagesPage from './StudentMessagesPage';

import { demoStudent } from '~/mocks/data/users';

const professorId = 'professor-1';
let messages: TeamMessage[] = [];
let posted: unknown[] = [];
let readIds: number[] = [];
let nextId = 705;

const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
    HttpResponse.json({
      id: 7,
      name: '7팀',
      members: [
        {
          id: 1,
          studentNumber: demoStudent.studentNumber,
          name: demoStudent.name,
          isLeader: true,
        },
        {
          id: 2,
          studentNumber: '20260002',
          name: '팀원',
          isLeader: false,
        },
      ],
    }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_THREAD.BY_TEAM('7')}`, () =>
    HttpResponse.json({
      threadId: 70,
      teamId: 7,
      createdAt: '2026-09-01T09:00:00Z',
    }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`, () =>
    HttpResponse.json({
      contents: [...messages].reverse(),
      pageable: {
        page: 0,
        size: 100,
        totalElements: messages.length,
        totalPages: messages.length ? 1 : 0,
        isEnd: true,
      },
    }),
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.READ(':messageId')}`,
    ({ params }) => {
      const id = Number(params.messageId);
      readIds.push(id);
      messages = messages.map(message =>
        message.id === id ? { ...message, read: true } : message,
      );
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.BY_TEAM('7')}`,
    async ({ request }) => {
      const body = (await request.json()) as {
        message: string;
        relatedId?: number;
        relatedType: TeamMessage['relatedType'];
      };
      posted.push(body);
      const created = {
        id: nextId++,
        threadId: 70,
        senderId: demoStudent.studentNumber,
        senderName: demoStudent.name,
        message: body.message,
        relatedType: body.relatedType,
        relatedId: body.relatedId,
        createdAt: '2026-09-17T09:30:00+09:00',
      };
      messages.push({ ...created, important: false, read: false });
      return HttpResponse.json(created, { status: 201 });
    },
  ),
);

const clients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'true');
  messages = [
    {
      id: 701,
      threadId: 70,
      senderId: professorId,
      senderName: '담당 교수',
      relatedType: 'PROPOSAL',
      relatedId: 19,
      message: '제안서의 문제 정의를 보완해 주세요.',
      createdAt: '2026-09-16T23:30:00Z',
      important: false,
      read: false,
    },
    {
      id: 702,
      threadId: 70,
      senderId: demoStudent.studentNumber,
      senderName: demoStudent.name,
      relatedType: 'PROPOSAL',
      relatedId: 19,
      message: '문제 정의를 수정했습니다.',
      createdAt: '2026-09-17T00:00:00Z',
      important: false,
      read: true,
    },
    {
      id: 703,
      threadId: 70,
      senderId: '20260002',
      senderName: '팀원',
      relatedType: 'PROPOSAL',
      relatedId: 19,
      message: '팀원 답장',
      createdAt: '2026-09-17T00:10:00Z',
      important: false,
      read: true,
    },
    {
      id: 704,
      threadId: 70,
      senderId: professorId,
      senderName: '담당 교수',
      relatedType: 'GENERAL',
      message: '다음 상담 시간을 확인해 주세요.',
      createdAt: '2026-09-17T00:20:00Z',
      important: false,
      read: true,
    },
  ];
  posted = [];
  readIds = [];
  nextId = 705;
  useAuthStore.getState().markAuthenticated('STUDENT');
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
});
afterEach(() => {
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AstryxThemeProvider>
  );
  return render(<StudentMessagesPage />, { wrapper: Wrapper });
}

it('교수자에게 받은 모든 팀 메시지만 테이블에 최신순으로 표시한다', async () => {
  renderPage();

  const openButtons = await screen.findAllByRole('button', {
    name: /대화 열기$/,
  });
  expect(openButtons.map(button => button.getAttribute('aria-label'))).toEqual([
    '일반 메시지 대화 열기',
    '제안서 피드백 대화 열기',
  ]);
  expect(screen.getByText('다음 상담 시간을 확인해 주세요.')).toBeVisible();
  expect(screen.queryByText('문제 정의를 수정했습니다.')).toBeNull();
  expect(screen.queryByText('팀원 답장')).toBeNull();
  expect(screen.queryByLabelText('답장 내용')).toBeNull();
});

it('조회된 교수자 메시지를 열어 기존 대화를 확인하고 같은 대상으로만 답장한다', async () => {
  const user = userEvent.setup();
  renderPage();

  await user.click(
    await screen.findByRole('button', { name: '제안서 피드백 대화 열기' }),
  );
  const dialog = await screen.findByRole('dialog', {
    name: '교수자 팀 메시지 대화',
  });
  expect(
    within(dialog).getByText('제안서의 문제 정의를 보완해 주세요.'),
  ).toBeVisible();
  expect(within(dialog).getByText('문제 정의를 수정했습니다.')).toBeVisible();
  expect(within(dialog).getByText('팀원 답장')).toBeVisible();
  await waitFor(() => expect(readIds).toEqual([701]));

  await user.type(within(dialog).getByLabelText('답장 내용'), '반영했습니다.');
  await user.click(within(dialog).getByRole('button', { name: '답장 보내기' }));

  await waitFor(() =>
    expect(posted).toEqual([
      {
        message: '반영했습니다.',
        relatedId: 19,
        relatedType: 'PROPOSAL',
      },
    ]),
  );
  expect(await within(dialog).findByText('반영했습니다.')).toBeVisible();
  expect(within(dialog).getByLabelText('답장 내용')).toHaveValue('');
});

it('대화 열기 버튼을 키보드로 실행할 수 있다', async () => {
  const user = userEvent.setup();
  renderPage();

  const openButton = await screen.findByRole('button', {
    name: '제안서 피드백 대화 열기',
  });
  openButton.focus();
  await user.keyboard('{Enter}');

  expect(
    await screen.findByRole('dialog', { name: '교수자 팀 메시지 대화' }),
  ).toBeVisible();
});

it('읽음 처리 실패를 알리고 같은 메시지의 읽음 처리를 다시 시도한다', async () => {
  const user = userEvent.setup();
  let attempts = 0;
  server.use(
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.TEAM_MESSAGE.READ(':messageId')}`,
      ({ params }) => {
        attempts += 1;
        if (attempts === 1) {
          return HttpResponse.json({ code: 'READ_FAILED' }, { status: 500 });
        }
        const id = Number(params.messageId);
        readIds.push(id);
        messages = messages.map(message =>
          message.id === id ? { ...message, read: true } : message,
        );
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  renderPage();

  await user.click(
    await screen.findByRole('button', { name: '제안서 피드백 대화 열기' }),
  );
  expect(
    await screen.findByText('읽음 상태를 저장하지 못했습니다.'),
  ).toBeVisible();

  await user.click(screen.getByRole('button', { name: '읽음 처리 다시 시도' }));
  await waitFor(() => expect(attempts).toBe(2));
  await waitFor(() =>
    expect(screen.queryByText('읽음 상태를 저장하지 못했습니다.')).toBeNull(),
  );
  expect(readIds).toEqual([701]);
});

it('받은 메시지가 없으면 답장 입력 없이 빈 상태를 안내한다', async () => {
  messages = [];
  renderPage();

  expect(await screen.findByText('받은 메시지가 없어요.')).toBeVisible();
  expect(screen.queryByLabelText('답장 내용')).toBeNull();
  expect(screen.queryByRole('button', { name: '답장 보내기' })).toBeNull();
});

it('팀이 없으면 메시지 API를 호출하지 않고 안내한다', async () => {
  let requests = 0;
  server.use(
    http.all('*', () => {
      requests += 1;
      return HttpResponse.json({});
    }),
  );
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: null });
  renderPage();

  expect(await screen.findByText('쪽지함을 열 수 없어요.')).toBeVisible();
  expect(requests).toBe(0);
});
