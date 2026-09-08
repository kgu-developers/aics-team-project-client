import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
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
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentHomePage from './StudentHomePage';

import { liveHomeUser } from '~/mocks/data/studentHomeLive';
import { studentMilestoneFixtures } from '~/mocks/data/studentMilestones';
import { studentHomeLiveHandlers } from '~/mocks/handlers/studentHomeLive';

const list = studentMilestoneFixtures(2).slice(0, 2);
const requests: string[] = [];
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
    HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 }),
  ),
  ...studentHomeLiveHandlers,
  http.get(`${API_BASE_URL}/api/v1/teams/7/topic-candidates`, () =>
    HttpResponse.json({ contents: [] }),
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
    HttpResponse.json({ contents: list }),
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION(':id')}`,
    ({ params }) =>
      HttpResponse.json({
        id: 9000 + Number(params.id),
        milestoneId: Number(params.id),
        teamId: 7,
        status:
          Number(params.id) === list[0]!.id
            ? 'COMPLETED'
            : 'REVISION_REQUESTED',
        currentVersion: 2,
        canSubmitNow: Number(params.id) !== list[0]!.id,
        hasPendingReview: false,
      }),
  ),
);
let queryClient: QueryClient;
let navigationHistory = createMemoryHistory({ initialEntries: ['/student'] });
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    requests.push(new URL(request.url).pathname),
  );
});
beforeEach(() => {
  sessionStorage.clear();
  navigationHistory = createMemoryHistory({ initialEntries: ['/student'] });
  useAuthStore.getState().setCurrentUser(liveHomeUser);
  useAuthStore.getState().markAuthenticated('STUDENT');
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});
afterEach(() => {
  queryClient.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  requests.length = 0;
});
afterAll(() => server.close());
function Wrapper({ children }: PropsWithChildren) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: navigationHistory,
  });
  return (
    <AstryxThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>
          {children}
        </RouterContextProvider>
      </QueryClientProvider>
    </AstryxThemeProvider>
  );
}

describe('학생 홈의 히어로·목록·제출 상태 API 연결', () => {
  it('프로젝트가 존재하면 새 세션의 홈에서도 제안서 작성 단계로 복원한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
        HttpResponse.json({
          id: 21,
          teamId: 7,
          title: '서버 프로젝트',
          goal: '팀 목표',
        }),
      ),
    );
    const first = render(<StudentHomePage />, { wrapper: Wrapper });
    expect(
      await screen.findByRole('button', { name: '작성하기' }),
    ).toBeInTheDocument();
    expect(screen.getByText('제안서 작성')).toBeInTheDocument();
    expect(screen.getByText('서버 프로젝트')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '후보 추가' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('주제 선정')).not.toBeInTheDocument();
    first.unmount();
    queryClient.clear();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(<StudentHomePage />, { wrapper: Wrapper });
    expect(
      await screen.findByRole('button', { name: '작성하기' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('주제 선정')).not.toBeInTheDocument();
  });
  it('확정 성공으로 홈의 후보 영역이 사라져도 작성 화면으로 이동한다', async () => {
    let finalized = false;
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
        finalized
          ? HttpResponse.json({ id: 21, teamId: 7, title: '팀 프로젝트' })
          : HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 }),
      ),
      http.get(`${API_BASE_URL}${ENDPOINTS.TOPIC.CANDIDATES('7')}`, () =>
        HttpResponse.json({
          contents: [
            {
              id: 1,
              title: '팀 프로젝트',
              description: '설명',
              proposerUserId: '202600002',
              voteCount: 2,
              votedByMe: true,
            },
          ],
        }),
      ),
      http.patch(`${API_BASE_URL}${ENDPOINTS.TOPIC.FINALIZE('7')}`, () => {
        finalized = true;
        return HttpResponse.json({
          projectId: 21,
          candidateId: 1,
          title: '팀 프로젝트',
        });
      }),
    );
    render(<StudentHomePage />, { wrapper: Wrapper });
    const user = userEvent.setup();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '주제 확정' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: '주제 확정' }));
    await user.click(
      within(screen.getByRole('dialog', { name: '팀 주제 확정' })).getByRole(
        'radio',
        { name: '팀 프로젝트' },
      ),
    );
    await user.type(screen.getByLabelText('프로젝트 목표'), '공동 목표');
    await user.click(screen.getByRole('button', { name: '이 주제로 확정' }));
    await waitFor(() =>
      expect(navigationHistory.location.pathname).toBe(
        '/student/editor/proposal/team-info',
      ),
    );
    expect(
      await screen.findByRole('button', { name: '작성하기' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '후보 추가' }),
    ).not.toBeInTheDocument();
  });

  it('주제 선정 일정이 열리면 후보를 등록하고 실제 팀 목록을 다시 조회한다', async () => {
    const candidate = {
      id: 81,
      title: '팀 일정',
      description: '함께 관리',
      proposerUserId: liveHomeUser.studentNumber,
    };
    let saved = false;
    let rejectFirst = true;
    let voted: number | undefined;
    const others = [82, 83].map(id => ({
      id,
      title: `다른 후보 ${id}`,
      description: '팀원 후보',
      proposerUserId: '202600002',
    }));
    const now = Date.now();
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
        HttpResponse.json({
          contents: [
            {
              ...list[0],
              title: '제안서',
              type: 'PROPOSAL',
              schedule: {
                opensAt: new Date(now - 60000).toISOString(),
                dueAt: new Date(now + 60000).toISOString(),
              },
            },
          ],
        }),
      ),
      http.get(`${API_BASE_URL}/api/v1/teams/7/topic-candidates`, () =>
        HttpResponse.json({
          contents: [...others, ...(saved ? [candidate] : [])].map(item => ({
            ...item,
            voteCount: voted === item.id ? 1 : 0,
            votedByMe: voted === item.id,
          })),
        }),
      ),
      http.post(
        `${API_BASE_URL}/api/v1/topic-candidates/:id/vote`,
        ({ params }) => {
          voted = Number(params.id);
          return HttpResponse.json(
            {
              id: 1,
              candidateId: voted,
              voterUserId: liveHomeUser.studentNumber,
            },
            { status: 201 },
          );
        },
      ),
      http.delete(`${API_BASE_URL}/api/v1/topic-candidates/:id/vote`, () => {
        voted = undefined;
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(
        `${API_BASE_URL}/api/v1/teams/7/topic-candidates`,
        async ({ request }) => {
          expect(await request.json()).toEqual({
            title: candidate.title,
            description: candidate.description,
          });
          if (rejectFirst) {
            rejectFirst = false;
            return HttpResponse.json({}, { status: 403 });
          }
          saved = true;
          return HttpResponse.json(candidate, { status: 201 });
        },
      ),
    );
    const user = userEvent.setup();
    render(<StudentHomePage />, { wrapper: Wrapper });
    const add = await screen.findByRole('button', { name: '후보 추가' });
    await waitFor(() => expect(add).toBeEnabled());
    await user.click(add);
    await user.type(screen.getByLabelText('후보 제목'), candidate.title);
    await user.type(screen.getByLabelText('후보 설명'), candidate.description);
    await user.click(
      within(screen.getByRole('dialog', { name: '주제 후보 추가' })).getByRole(
        'button',
        { name: '후보 추가' },
      ),
    );
    expect(
      await within(
        screen.getByRole('dialog', { name: '주제 후보 추가' }),
      ).findByText('이 팀의 주제 보드에 접근할 수 없어요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '후보 제목' })).toHaveValue(
      candidate.title,
    );
    await user.click(
      within(screen.getByRole('dialog', { name: '주제 후보 추가' })).getByRole(
        'button',
        { name: '후보 추가' },
      ),
    );
    expect(
      await screen.findByRole('radio', { name: candidate.title }),
    ).toBeDisabled();
    expect(
      screen.queryByRole('dialog', { name: '주제 후보 추가' }),
    ).not.toBeInTheDocument();
    const first = screen.getByRole('radio', { name: '다른 후보 82' });
    const second = screen.getByRole('radio', { name: '다른 후보 83' });
    await waitFor(() => expect(first).toBeEnabled());
    await user.click(first);
    await waitFor(() => expect(first).toBeChecked());
    await waitFor(() => expect(second).toBeEnabled());
    await user.click(second);
    await waitFor(() => expect(second).toBeChecked());
    expect(first).not.toBeChecked();
    await waitFor(() => expect(second).toBeEnabled());
    await user.click(second);
    await waitFor(() => expect(second).not.toBeChecked());
  });
  it('구 dashboard 없이 히어로 탭과 서버 단계·제출 상태를 표시한다', async () => {
    const user = userEvent.setup();
    render(<StudentHomePage />, { wrapper: Wrapper });
    expect(await screen.findByText('공지 4')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {
        name: '중간보고서 진행 상태를 확인해 주세요.',
      }),
    ).toBeInTheDocument();
    expect(
      document.getElementById(`student-milestone-${list[0]!.id}`),
    ).toHaveTextContent('단계 완료');
    expect(
      document.getElementById(`student-milestone-${list[1]!.id}`),
    ).toHaveTextContent('수정 요청');
    expect(
      document.querySelectorAll(
        '[id^=student-milestone-] button[aria-expanded]',
      ),
    ).toHaveLength(1);
    const proposal = document.getElementById(
      `student-milestone-${list[0]!.id}`,
    )!;
    expect(proposal).toHaveTextContent('주제 후보 선택');
    expect(
      screen.queryByRole('heading', { name: '우리 팀 주제 후보' }),
    ).not.toBeInTheDocument();
    const trigger = proposal.querySelector('button[aria-expanded]')!;
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(
      screen.getByRole('heading', { name: '주제 후보 선택' }),
    ).toBeVisible();
    expect(screen.queryByText('제출 가능 여부')).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '회의록' }));
    expect(await screen.findByText('회의 4')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: '액션 플랜' }));
    expect(await screen.findByText('액션 4')).toBeInTheDocument();
    expect(screen.queryByText('액션 6')).not.toBeInTheDocument();
    expect(
      requests.some(
        path =>
          path.includes('/dashboard/') ||
          path.includes('/admin/') ||
          path.startsWith('/proposals/'),
      ),
    ).toBe(false);
  });
  it('목록 실패 시 공지 히어로를 유지하고 목록만 재시도한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
        HttpResponse.json({}, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    render(<StudentHomePage />, { wrapper: Wrapper });
    expect(await screen.findByText('공지 4')).toBeInTheDocument();
    await user.click(
      await screen.findByRole('button', { name: '마일스톤 목록 다시 시도' }),
    );
    expect(
      requests.filter(path => path.endsWith('/announcements')),
    ).toHaveLength(1);
  });
  it('한 단계의 제출 실패를 미제출로 표시하지 않고 다른 단계는 유지한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION(String(list[1]!.id))}`,
        () => HttpResponse.json({}, { status: 403 }),
      ),
    );
    const user = userEvent.setup();
    render(<StudentHomePage />, { wrapper: Wrapper });
    await screen.findByRole('button', { name: '제출 상태 다시 시도' });
    expect(
      document.getElementById(`student-milestone-${list[0]!.id}`),
    ).toHaveTextContent('단계 완료');
    expect(
      document.getElementById(`student-milestone-${list[1]!.id}`),
    ).toHaveTextContent('조회 실패');
    expect(
      document.getElementById(`student-milestone-${list[1]!.id}`),
    ).not.toHaveTextContent('미제출');
    server.resetHandlers();
    await user.click(
      screen.getByRole('button', { name: '제출 상태 다시 시도' }),
    );
    await waitFor(() =>
      expect(
        document.getElementById(`student-milestone-${list[1]!.id}`),
      ).toHaveTextContent('수정 요청'),
    );
    expect(
      requests.filter(path => path === ENDPOINTS.STUDENT_MILESTONE.LIST('2')),
    ).toHaveLength(1);
  });
  it('빈 목록은 조회 실패와 구분한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
        HttpResponse.json({ contents: [] }),
      ),
    );
    render(<StudentHomePage />, { wrapper: Wrapper });
    expect(
      await screen.findByText('등록된 마일스톤이 없어요.'),
    ).toBeInTheDocument();
    expect(requests.some(path => path.endsWith('/my-team-submission'))).toBe(
      false,
    );
  });
});
