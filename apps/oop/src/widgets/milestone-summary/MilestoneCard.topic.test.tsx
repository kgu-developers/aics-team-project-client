import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { StudentHomeMilestone } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { TopicApiProvider } from '~/features/project-topic/TopicApiContext';

import MilestoneCard from './MilestoneCard';

import { demoAccessToken } from '~/mocks/data/users';
import { createLiveTopicHandlers } from '~/mocks/handlers/liveTopic';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }));
const server = setupServer();
let client: QueryClient;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  client?.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  navigate.mockClear();
});
afterAll(() => server.close());
const milestone: StudentHomeMilestone = {
  id: '1301',
  title: '제안서',
  period: '진행 중',
  dueDate: '마감 전',
  status: 'in-progress',
  statusLabel: '미제출',
  interaction: 'static',
  isDetailAvailable: false,
  rows: [
    {
      id: 'proposal-topic-selection',
      label: '주제 선정',
      value: '후보를 등록하고 투표해 주세요.',
      tone: 'default',
      actionLabel: '후보 추가',
    },
  ],
};
function setup({ votes = 3, studentNumber = '20260001' } = {}) {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  let count = votes;
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATES('7')}`, () =>
      HttpResponse.json({
        contents: [
          {
            id: 1,
            title: '도서 대여 관리',
            description: '도서 관리',
            proposerUserId: '20260001',
            voteCount: count,
            votedByMe: true,
          },
        ],
      }),
    ),
    ...createLiveTopicHandlers(),
    ...createMeetingApiHandlers(),
  );
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <TopicApiProvider
          sectionId='2'
          teamId='7'
          studentNumber={studentNumber}
          eligibility={{ status: 'open' }}
        >
          <MilestoneCard milestone={milestone} isOpen />
        </TopicApiProvider>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
  return {
    setVotes: (next: number) => {
      count = next;
    },
  };
}
it('팀장에게 전원 투표 뒤 기존 CTA 한 개만 확정으로 전환하고 성공 후 작성 화면으로 이동한다', async () => {
  const state = setup({ votes: 2 });
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(screen.getByRole('button', { name: '후보 추가' })).toBeDisabled(); // own candidate does not disable finalization
  expect(
    screen.queryByRole('button', { name: '주제 확정' }),
  ).not.toBeInTheDocument();
  state.setVotes(3);
  await client.invalidateQueries({ queryKey: ['project-topic'] });
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '주제 확정' })).toBeEnabled(),
  );
  expect(
    screen.queryByRole('button', { name: '후보 추가' }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: '주제 확정' })).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: '주제 확정' }));
  await user.click(screen.getByRole('radio', { name: /도서 대여 관리/ }));
  await user.type(screen.getByLabelText('프로젝트 목표'), '대여 관리 개선');
  await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith({
      to: '/student/editor/proposal/team-info',
    }),
  );
});
it('팀원은 전원 투표 상태에서도 후보 추가를 유지한다', async () => {
  setup({ studentNumber: '20260003' });
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(screen.getByRole('button', { name: '후보 추가' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '주제 확정' }),
  ).not.toBeInTheDocument();
});
it('전원 투표 뒤 누군가 취소하면 다시 후보 추가로 돌아간다', async () => {
  const state = setup();
  await screen.findByRole('button', { name: '주제 확정' });
  state.setVotes(2);
  await client.invalidateQueries({ queryKey: ['project-topic'] });
  expect(
    await screen.findByRole('button', { name: '후보 추가' }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '주제 확정' }),
  ).not.toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
});
