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
  phase: 'MID_CHECK',
  meetingAt: '2026-09-06 14:00',
  location: '301호',
  authorId: student.studentNumber,
  participantCount: 2,
};
const server = setupServer();
const clients: QueryClient[] = [];

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  useAuthStore.getState().setCurrentUser(student);
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
  return renderWithRouter(
    <QueryClientProvider client={client}>{page}</QueryClientProvider>,
  );
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

  expect(await screen.findByText('중간 점검')).toBeVisible();
  expect(requests).toHaveBeenCalledTimes(1);
  expect(screen.getByText('2026-09-06')).toBeVisible();
  expect(screen.getByText('참석 2명 · 301호')).toBeVisible();
  expect(
    screen.getByRole('columnheader', { name: '작성자 학번' }),
  ).toBeVisible();
  expect(screen.getByText(student.studentNumber)).toBeVisible();
  expect(screen.queryByText('소속 팀이 없어요.')).not.toBeInTheDocument();
  expect(screen.queryByText(/액션 플랜/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: '중간 점검' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '새 회의록' })).toBeDisabled();
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
    http.get(`${API_BASE_URL}/teams/8/meeting-records`, () =>
      HttpResponse.json({ contents: [{ ...summary, id: 20, phase: 'FINAL' }] }),
    ),
  );
  renderPage();
  expect(await screen.findByText('중간 점검')).toBeVisible();
  act(() =>
    useAuthStore.getState().setCurrentUser({ ...student, teamId: '8' }),
  );
  expect(await screen.findByText('최종')).toBeVisible();
  await waitFor(() =>
    expect(screen.queryByText('중간 점검')).not.toBeInTheDocument(),
  );
});

it('팀이 있는 학생이 작성 주소를 직접 열어도 팀 미배정으로 안내하지 않는다', () => {
  renderPage(<MeetingNewPage />);
  expect(screen.getByText('회의록 작성 기능을 준비 중이에요.')).toBeVisible();
  expect(screen.queryByText('소속 팀이 없어요.')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '회의록 목록으로' })).toHaveAttribute(
    'href',
    '/student/meetings',
  );
});
