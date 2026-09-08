import {
  API_BASE_URL,
  ENDPOINTS,
  fetchTeamProject,
  updateTopicFinalization,
} from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
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

import TopicFinalizePanel, {
  type TopicFinalizePanelProps,
} from './TopicFinalizePanel';

import { demoAccessToken, demoPartnerAccessToken } from '~/mocks/data/users';
import { createLiveTopicHandlers } from '~/mocks/handlers/liveTopic';
import { createMeetingApiHandlers } from '~/mocks/handlers/meetingApi';

const server = setupServer();
const clients: QueryClient[] = [];
const props: TopicFinalizePanelProps = {
  sectionId: '2',
  teamId: '7',
  studentNumber: '20260001',
  eligibility: { status: 'open' },
};
const finalizeUrl = `${API_BASE_URL}${ENDPOINTS.TOPIC.FINALIZE('7')}`;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  server.use(...createLiveTopicHandlers(), ...createMeetingApiHandlers());
});
afterEach(() => {
  clients.forEach(client => client.clear());
  clients.length = 0;
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function setup(overrides: Partial<TopicFinalizePanelProps> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </AstryxThemeProvider>
  );
  const view = render(<TopicFinalizePanel {...props} {...overrides} />, {
    wrapper: Wrapper,
  });
  return { ...view, client, Wrapper };
}
async function fill() {
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '주제 확정' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: '주제 확정' }));
  await user.click(screen.getByRole('radio', { name: /도서 대여 관리/ }));
  await user.type(
    screen.getByLabelText('프로젝트 목표'),
    '대여 시간을 줄입니다.',
  );
  return user;
}
it('팀장이 확정하면 프로젝트를 재조회하고 새 팀원 세션에서도 제목과 목표를 복원한다', async () => {
  const first = setup();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
  expect(
    await screen.findByText('주제를 확정했어요: 도서 대여 관리'),
  ).toBeInTheDocument();
  expect(
    await screen.findByText('대여 시간을 줄입니다.', { selector: 'span' }),
  ).toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  first.unmount();
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  setup({ studentNumber: '20260003' });
  expect(
    await screen.findByText('대여 시간을 줄입니다.', { selector: 'span' }),
  ).toBeInTheDocument();
  expect(screen.getByText('도서 대여 관리')).toBeInTheDocument();
  expect(screen.queryByText(/주제를 확정했어요/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '주제 확정' })).toBeDisabled();
});
it('기존 프로젝트 제목이 후보와 같아도 확정 상태로 추정하지 않고 변경 영향을 안내한다', async () => {
  server.use(
    ...createLiveTopicHandlers({
      id: 17,
      teamId: 7,
      title: '도서 대여 관리',
      goal: '기존 목표',
    }),
  );
  setup();
  const user = await fill();
  expect(screen.queryByText(/주제를 확정했어요/)).not.toBeInTheDocument();
  expect(screen.getByText(/기존 팀원 동의가 초기화/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '닫기' }));
});
it('403 실패 후 후보와 목표를 보존하고 수정한 권한으로 명시적 재시도한다', async () => {
  server.use(
    http.patch(finalizeUrl, () =>
      HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 }),
    ),
  );
  setup();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
  expect(
    await screen.findByText('이 팀의 팀장만 주제를 확정할 수 있어요.'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('프로젝트 목표')).toHaveValue(
    '대여 시간을 줄입니다.',
  );
  expect(screen.getByRole('radio', { name: /도서 대여 관리/ })).toBeChecked();
  server.use(...createLiveTopicHandlers());
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '이 주제로 확정' }),
    ).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
  expect(
    await screen.findByText('주제를 확정했어요: 도서 대여 관리'),
  ).toBeInTheDocument();
});
it('결과가 불확실한 요청은 자동 재시도하지 않고 재마운트와 프로젝트 재조회 후에도 재전송을 막는다', async () => {
  const call = vi.fn(() =>
    HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 }),
  );
  server.use(http.patch(finalizeUrl, call));
  const view = setup();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
  await screen.findByText(/확정 요청의 결과를 확인하지 못했어요/);
  view.unmount();
  render(<TopicFinalizePanel {...props} />, { wrapper: view.Wrapper });
  await user.click(screen.getByRole('button', { name: '프로젝트 다시 확인' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '주제 확정' })).toBeDisabled(),
  );
  expect(call).toHaveBeenCalledTimes(1);
});
it('연속 제출과 문맥 변경 중 이전 요청 완료가 새 폼에 반영되지 않는다', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const call = vi.fn(async () => {
    await gate;
    return HttpResponse.json({
      projectId: 17,
      candidateId: 1,
      title: '도서 대여 관리',
    });
  });
  server.use(http.patch(finalizeUrl, call));
  const view = setup();
  const user = await fill();
  await user.dblClick(screen.getByRole('button', { name: '이 주제로 확정' }));
  await waitFor(() => expect(call).toHaveBeenCalledTimes(1));
  view.rerender(<TopicFinalizePanel {...props} studentNumber='20260003' />);
  await act(async () => {
    release();
    await gate;
  });
  await waitFor(() => expect(view.client.isMutating()).toBe(0));
  expect(screen.queryByText(/주제를 확정했어요/)).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it.each([{ status: 'closed' as const }, { status: 'unknown' as const }])(
  '기간이 $status이면 확정을 막는다',
  async eligibility => {
    const view = setup({ eligibility });
    await waitFor(() => expect(view.client.isFetching()).toBe(0));
    expect(screen.getByRole('button', { name: '주제 확정' })).toBeDisabled();
  },
);
it('열려 있던 폼도 실제 마감 시각을 지나면 전송하지 않는다', async () => {
  const window = { opensAt: 0, dueAt: Date.now() + 60_000 };
  const call = vi.fn();
  server.use(http.patch(finalizeUrl, call));
  setup({ eligibility: { status: 'open', window } });
  const user = await fill();
  window.dueAt = Date.now() - 1;
  await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
  expect(call).not.toHaveBeenCalled();
});
it('완료된 제안서는 확정을 막는다', async () => {
  server.use(
    ...createLiveTopicHandlers({
      id: 17,
      teamId: 7,
      title: '완료한 프로젝트',
      proposalCompletedAt: '2026-09-01T12:00:00',
    }),
  );
  setup();
  expect(
    await screen.findByText('제안서 작성이 완료되어 주제를 변경할 수 없어요.'),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '주제 확정' })).toBeDisabled();
});
it('팀 ID가 없으면 네트워크를 호출하지 않는다', () => {
  const call = vi.fn();
  server.use(http.all('*', call));
  setup({ teamId: undefined });
  expect(
    screen.getByText('소속 분반과 팀을 확인해 주세요.'),
  ).toBeInTheDocument();
  expect(call).not.toHaveBeenCalled();
});
it('팀원 직접 PATCH는 거절하며 프로젝트를 변경하지 않는다', async () => {
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  await expect(
    updateTopicFinalization('7', { candidateId: 1, goal: '목표' }),
  ).rejects.toMatchObject({ response: { status: 403 } });
  expect(await fetchTeamProject('7')).toBeNull();
});
