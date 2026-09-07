import { API_BASE_URL } from '@aics/api-client';
import type { CurrentUser } from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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
import { meetingApiKeys } from '~/features/meeting/queries/api/meetingApiKeys';

import { MeetingListPage, MeetingNewPage } from './MeetingPages';

import { renderWithRouter } from '~/test/renderWithRouter';

const student: CurrentUser = {
  id: '202600001',
  studentNumber: '202600001',
  name: '테스트 학생',
  email: 'student@example.test',
  globalRole: 'STUDENT',
  sections: [
    { id: '12', code: 'TEST12', name: '테스트 분반', role: 'STUDENT' },
  ],
  teamId: '7',
  currentTeam: null,
};
const summary = {
  id: 19,
  title: '진행 점검',
  phase: 'MID_CHECK',
  meetingAt: '2026-09-06 14:00',
  location: '301호',
  authorId: student.studentNumber,
  participantCount: 2,
};
const kickoff = {
  id: 7,
  name: '테스트 팀',
  members: [
    {
      id: 500,
      studentNumber: student.studentNumber,
      name: student.name,
      isLeader: true,
    },
  ],
};
const server = setupServer();
const clients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  useAuthStore.getState().setCurrentUser(student);
  server.use(
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () =>
      HttpResponse.json(kickoff),
    ),
  );
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

function renderPage(page = <MeetingListPage />) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return {
    ...renderWithRouter(
      <QueryClientProvider client={client}>{page}</QueryClientProvider>,
    ),
    client,
  };
}

it('currentTeam이 없어도 /me의 teamId로 실제 응답을 읽고 지원하는 항목만 표시한다', async () => {
  const requests = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/teams/7/meeting-records`, () => {
      requests();
      return HttpResponse.json({ contents: [summary] });
    }),
  );
  renderPage();

  expect(await screen.findByText('진행 점검')).toBeVisible();
  expect(requests).toHaveBeenCalledTimes(1);
  expect(screen.getByText('2026-09-06')).toBeVisible();
  expect(screen.getByText('참석 2명 · 301호')).toBeVisible();
  expect(screen.getByRole('columnheader', { name: '작성자' })).toBeVisible();
  expect(await screen.findByText(student.name)).toBeVisible();
  expect(screen.queryByText('소속 팀이 없어요.')).not.toBeInTheDocument();
  expect(screen.queryByText(/액션 플랜/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '진행 점검' })).toHaveAttribute(
    'href',
    '/student/meetings/19',
  );
  expect(screen.getByRole('button', { name: '새 회의록' })).toBeEnabled();
});

it('목록 응답이 먼저 와도 팀원 정보를 기다린 뒤 작성자 이름을 표시한다', async () => {
  let releaseKickoff!: () => void;
  const kickoffReady = new Promise<void>(resolve => {
    releaseKickoff = resolve;
  });
  server.use(
    http.get(`${API_BASE_URL}/teams/7/meeting-records`, () =>
      HttpResponse.json({ contents: [summary] }),
    ),
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, async () => {
      await kickoffReady;
      return HttpResponse.json(kickoff);
    }),
  );
  const { client } = renderPage();
  try {
    await waitFor(() =>
      expect(
        client.getQueryData(meetingApiKeys.filteredList('7')),
      ).toBeDefined(),
    );
    expect(screen.getByText('잠시만 기다려 주세요.')).toBeVisible();
    expect(screen.queryByText('진행 점검')).not.toBeInTheDocument();
    expect(screen.queryByText(student.studentNumber)).not.toBeInTheDocument();
  } finally {
    await act(async () => releaseKickoff());
  }
  expect(await screen.findByText('진행 점검')).toBeVisible();
  expect(screen.getByText(student.name)).toBeVisible();
});

it.each([403, 500])(
  '팀원 정보 조회 %s 실패를 표시하고 재시도로 목록과 팀원 정보를 복구한다',
  async status => {
    const summaryRequests = vi.fn();
    const kickoffRequests = vi.fn();
    server.use(
      http.get(`${API_BASE_URL}/teams/7/meeting-records`, () => {
        summaryRequests();
        return HttpResponse.json({ contents: [summary] });
      }),
      http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () => {
        kickoffRequests();
        return new HttpResponse(null, { status });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('회의록을 불러올 수 없어요.')).toBeVisible();
    expect(screen.queryByText('진행 점검')).not.toBeInTheDocument();
    expect(screen.queryByText(student.studentNumber)).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled(),
    );
    server.use(
      http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, () => {
        kickoffRequests();
        return HttpResponse.json(kickoff);
      }),
    );
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('진행 점검')).toBeVisible();
    expect(screen.getByText(student.name)).toBeVisible();
    expect(summaryRequests).toHaveBeenCalledTimes(2);
    expect(kickoffRequests).toHaveBeenCalledTimes(2);
  },
);

it('목록 조회가 실패해도 팀원 조회 중에는 재시도를 비활성화한다', async () => {
  let releaseKickoff!: () => void;
  const kickoffReady = new Promise<void>(resolve => {
    releaseKickoff = resolve;
  });
  server.use(
    http.get(
      `${API_BASE_URL}/teams/7/meeting-records`,
      () => new HttpResponse(null, { status: 500 }),
    ),
    http.get(`${API_BASE_URL}/api/v1/oop/teams/7/kickoff`, async () => {
      await kickoffReady;
      return HttpResponse.json(kickoff);
    }),
  );
  renderPage();
  try {
    expect(await screen.findByText('회의록을 불러올 수 없어요.')).toBeVisible();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeDisabled();
  } finally {
    await act(async () => releaseKickoff());
  }
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled(),
  );
});

it('팀에 속해 있지만 회의록이 없으면 빈 목록을 표시한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/teams/7/meeting-records`, () =>
      HttpResponse.json({ contents: [] }),
    ),
  );
  renderPage();
  expect(await screen.findByText('등록된 회의록이 없어요.')).toBeVisible();
  expect(screen.queryByText('소속 팀이 없어요.')).not.toBeInTheDocument();
});

it('실제 teamId가 없으면 오래된 currentTeam이 있어도 목록을 요청하지 않는다', async () => {
  const requests = vi.fn();
  server.use(
    http.get('*', () => {
      requests();
      return HttpResponse.json({ contents: [] });
    }),
  );
  useAuthStore.getState().setCurrentUser({
    ...student,
    teamId: null,
    currentTeam: { id: '7', sectionId: '12', name: '이전 팀', members: [] },
  });
  renderPage();
  expect(screen.getByText('소속 팀이 없어요.')).toBeVisible();
  await act(async () => {});
  expect(requests).not.toHaveBeenCalled();
});

it('유효하지 않은 팀 ID는 요청하지 않고 로딩 대신 오류를 표시한다', async () => {
  const requests = vi.fn();
  server.use(
    http.get('*', () => {
      requests();
      return HttpResponse.json({ contents: [] });
    }),
  );
  useAuthStore.getState().setCurrentUser({ ...student, teamId: 'invalid' });
  renderPage();
  expect(screen.getByText('회의록을 불러올 수 없어요.')).toBeVisible();
  expect(screen.getByRole('button', { name: '다시 시도' })).toBeDisabled();
  await act(async () => {});
  expect(requests).not.toHaveBeenCalled();
});

it.each([403, 500])(
  '서버 %s 응답은 팀 미배정으로 표시하지 않고 재시도할 수 있다',
  async status => {
    const requests = vi.fn();
    server.use(
      http.get(`${API_BASE_URL}/teams/7/meeting-records`, () => {
        requests();
        return new HttpResponse(null, { status });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText('회의록을 불러올 수 없어요.')).toBeVisible();
    expect(screen.queryByText('소속 팀이 없어요.')).not.toBeInTheDocument();

    server.use(
      http.get(`${API_BASE_URL}/teams/7/meeting-records`, () => {
        requests();
        return HttpResponse.json({ contents: [] });
      }),
    );
    await user.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('등록된 회의록이 없어요.')).toBeVisible();
    expect(requests).toHaveBeenCalledTimes(2);
  },
);

it('팀이 변경되면 새 팀을 조회하고 이전 팀의 회의록을 표시하지 않는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/teams/7/meeting-records`, () =>
      HttpResponse.json({ contents: [summary] }),
    ),
    http.get(`${API_BASE_URL}/api/v1/oop/teams/8/kickoff`, () =>
      HttpResponse.json({ id: 8, name: '다른 팀', members: [] }),
    ),
    http.get(`${API_BASE_URL}/teams/8/meeting-records`, () =>
      HttpResponse.json({
        contents: [{ ...summary, id: 20, title: null, phase: 'FINAL' }],
      }),
    ),
  );
  renderPage();
  expect(await screen.findByText('진행 점검')).toBeVisible();
  act(() =>
    useAuthStore.getState().setCurrentUser({ ...student, teamId: '8' }),
  );
  expect(await screen.findByText('최종 회의록')).toBeVisible();
  await waitFor(() =>
    expect(screen.queryByText('진행 점검')).not.toBeInTheDocument(),
  );
});

it('currentTeam이 없는 학생도 kickoff 학번으로 새 회의록을 작성할 수 있다', async () => {
  renderPage(<MeetingNewPage />);
  expect(
    await screen.findByRole('heading', { name: '새 회의록' }),
  ).toBeVisible();
  expect(screen.getByRole('textbox', { name: /회의 제목/ })).toBeVisible();
  expect(screen.getByText(/^회의 단계/)).toBeVisible();
  expect(screen.getByText(/^회의 시간/)).toBeVisible();
  expect(screen.queryByText('소속 팀이 없어요.')).not.toBeInTheDocument();
});
