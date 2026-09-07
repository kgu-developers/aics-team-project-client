import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { SectionResponse, TeamKickoffResponse } from '@aics/core';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
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

import LiveTeamAssignmentFlow from './LiveTeamAssignmentFlow';
import { teamMemberContactsQueryKey } from './queries';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  Navigate: ({ to }: { to: string }) => <p>이동: {to}</p>,
}));
vi.mock('~/shared/config/developmentMode', () => ({
  isMockDevelopmentMode: () => false,
}));

const section: SectionResponse = {
  id: 1,
  code: 'CS101',
  name: '01',
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: '2020-01-01T00:00:00+09:00',
  contactVisibleUntil: null,
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2026,
  semester: 'FALL',
  status: 'ACTIVE',
};
const initialTeam: TeamKickoffResponse = {
  id: 4,
  name: '7조',
  members: [
    {
      id: 10,
      studentNumber: '20260001',
      name: '한가온',
      isLeader: false,
      projectRole: null,
    },
    {
      id: 11,
      studentNumber: '20260003',
      name: '윤새봄',
      isLeader: false,
      projectRole: null,
    },
  ],
};
let team: TeamKickoffResponse;
let activeSection: SectionResponse;
let client: QueryClient;
const meRequests = vi.fn();
const contactRequests = vi.fn();
const claimRequests = vi.fn();
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () => {
    meRequests();
    return HttpResponse.json({
      studentNumber: '20260001',
      name: '한가온',
      email: 'gaon@example.com',
      phone: null,
      globalRole: 'USER',
      teamId: 4,
      sections: [activeSection],
    });
  }),
  http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, () =>
    HttpResponse.json({ contents: [activeSection] }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('4')}`, () =>
    HttpResponse.json(team),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.MEMBER_CONTACTS('4')}`, () => {
    contactRequests();
    return HttpResponse.json({
      contents: [
        { studentNumber: '20260003', phone: '010-0000-0003', isLeader: false },
        { studentNumber: '20260001', phone: '010-0000-0001', isLeader: false },
      ],
    });
  }),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.TEAM.LEADER_CLAIM('4')}`,
    async ({ request }) => {
      claimRequests();
      expect(await request.text()).toBe('');
      team.members[0]!.isLeader = true;
      return new HttpResponse(null, { status: 204 });
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  team = structuredClone(initialTeam);
  activeSection = { ...section };
  vi.clearAllMocks();
  useAuthStore.getState().markAuthenticated('STUDENT');
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});
afterEach(() => {
  client.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function renderFlow(teamOnly = false) {
  return render(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <ToastViewport isTopLayer={false}>
          <LiveTeamAssignmentFlow teamOnly={teamOnly} />
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}
async function viewTeam() {
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: '우리 팀 확인하기' }));
}
async function enterFirstMeeting() {
  await viewTeam();
  await userEvent.setup().click(screen.getByRole('button', { name: '다음' }));
}
async function claimLeader() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: '내가 팀장입니다' }),
  );
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: '확정' }),
  );
}

it('공개 중에도 결과·팀원·다음 단계를 거친 뒤 연락처를 연결하고 선점 204 후 재조회한다', async () => {
  renderFlow();
  await viewTeam();
  expect(screen.getByText('20260001')).toBeVisible();
  expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: '내가 팀장입니다' })).toBeNull();
  expect(contactRequests).not.toHaveBeenCalled();
  await userEvent.setup().click(screen.getByRole('button', { name: '다음' }));
  const phone = await screen.findByRole('button', {
    name: '010-0000-0001 복사',
  });
  expect(within(phone.closest('tr')!).getByText('한가온')).toBeVisible();
  await claimLeader();
  expect(await screen.findByText('이동: /student')).toBeVisible();
  expect(screen.getByText('팀장으로 확정되었어요.')).toBeVisible();
  expect(claimRequests).toHaveBeenCalledOnce();
  expect(meRequests).toHaveBeenCalledTimes(2);
  await waitFor(() =>
    expect(
      client.getQueryData(teamMemberContactsQueryKey('4')),
    ).toBeUndefined(),
  );
});

it('선점 409 후 홈으로 이동해도 실패 안내가 남고 성공 안내는 표시하지 않는다', async () => {
  server.use(
    http.post(`${API_BASE_URL}${ENDPOINTS.TEAM.LEADER_CLAIM('4')}`, () => {
      team.members[1]!.isLeader = true;
      return new HttpResponse(null, { status: 409 });
    }),
  );
  renderFlow();
  await enterFirstMeeting();
  await claimLeader();
  expect(await screen.findByText('이동: /student')).toBeVisible();
  expect(
    screen.getByText(
      '이미 팀장이 확정되어 신청하지 못했어요. 프로필에서 팀장을 확인해 주세요.',
    ),
  ).toBeVisible();
  expect(screen.queryByText('팀장으로 확정되었어요.')).toBeNull();
  expect(meRequests).toHaveBeenCalledTimes(2);
});

it('내 팀에서 서버가 확정한 팀장의 이름과 학번을 확인할 수 있다', async () => {
  team.members[1]!.isLeader = true;
  renderFlow(true);
  expect(await screen.findByText('팀장: 윤새봄 (20260003)')).toBeVisible();
  expect(screen.queryByText('이동: /student')).toBeNull();
  expect(contactRequests).not.toHaveBeenCalled();
});

it.each(['2099-01-01T00:00:00+09:00', null])(
  '온보딩 시작 전 또는 일정 미설정(%s)이면 팀원 확인의 다음 버튼이 비활성화된다',
  async start => {
    activeSection.contactVisibleFrom = start;
    renderFlow();
    await viewTeam();
    const next = screen.getByRole('button', { name: '다음' });
    expect(next).toBeDisabled();
    await userEvent.setup().click(next);
    expect(screen.getByText('20260001')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: '내가 팀장입니다' }),
    ).toBeNull();
    expect(contactRequests).not.toHaveBeenCalled();
    expect(claimRequests).not.toHaveBeenCalled();
  },
);

it('온보딩 시작 시각이 되면 팀원 확인 화면의 다음만 활성화하고 클릭 후 연락처를 표시한다', async () => {
  const start = Date.parse('2026-09-10T10:00:00+09:00');
  const now = vi.spyOn(Date, 'now').mockReturnValue(start - 60_000);
  activeSection.contactVisibleFrom = '2026-09-10T10:00:00+09:00';
  renderFlow();
  await viewTeam();
  expect(screen.getByRole('button', { name: '다음' })).toBeDisabled();
  act(() => {
    now.mockReturnValue(start);
    window.dispatchEvent(new Event('focus'));
  });
  expect(screen.getByRole('button', { name: '다음' })).toBeEnabled();
  expect(contactRequests).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: '내가 팀장입니다' })).toBeNull();
  await userEvent.setup().click(screen.getByRole('button', { name: '다음' }));
  expect(
    await screen.findByRole('button', { name: '010-0000-0001 복사' }),
  ).toBeVisible();
});

it('연락처 기간 종료 후에는 번호를 요청하지 않고 팀장 선정만 허용한다', async () => {
  activeSection.contactVisibleUntil = '2020-01-02T00:00:00+09:00';
  renderFlow();
  await enterFirstMeeting();
  expect(
    await screen.findByText('팀원 연락처 공개 기간이 종료됐어요.'),
  ).toBeVisible();
  expect(contactRequests).not.toHaveBeenCalled();
  expect(screen.queryByText(/010-0000/)).not.toBeInTheDocument();
  await claimLeader();
  expect(await screen.findByText('이동: /student')).toBeVisible();
});

it.each([401, 403, 404, 500])(
  'kickoff %s는 설문이나 빈 팀으로 바꾸지 않고 재시도할 수 있다',
  async status => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('4')}`,
        () => new HttpResponse(null, { status }),
      ),
    );
    renderFlow();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '배정된 팀 정보를 확인하지 못했어요.',
    );
    expect(contactRequests).not.toHaveBeenCalled();
    server.resetHandlers();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: '다시 확인' }));
    await enterFirstMeeting();
    expect(
      await screen.findByRole('button', { name: '010-0000-0001 복사' }),
    ).toBeVisible();
  },
);

it('연락처 조회 실패는 팀장 선정을 막지 않고 연락처만 재시도한다', async () => {
  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.TEAM.MEMBER_CONTACTS('4')}`,
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  renderFlow();
  await enterFirstMeeting();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    '팀원 연락처를 불러오지 못했습니다.',
  );
  expect(screen.getByRole('button', { name: '내가 팀장입니다' })).toBeEnabled();
  server.resetHandlers();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: '다시 확인' }));
  expect(
    await screen.findByRole('button', { name: '010-0000-0001 복사' }),
  ).toBeVisible();
});
