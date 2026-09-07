import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from '@tanstack/react-router';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
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
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import StudentHomePage from './StudentHomePage';

import { liveHomeUser } from '~/mocks/data/studentHomeLive';
import { studentHomeLiveHandlers } from '~/mocks/handlers/studentHomeLive';

const server = setupServer(...studentHomeLiveHandlers);
const clients: QueryClient[] = [];
const requests: string[] = [];

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    requests.push(new URL(request.url).pathname),
  );
});
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  useAuthStore.getState().setCurrentUser(liveHomeUser);
});
afterEach(() => {
  clients.forEach(client => client.clear());
  clients.length = 0;
  requests.length = 0;
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());

function renderHome() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ['/student'] }),
  });
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>
          <RouterContextProvider router={router}>
            {children}
          </RouterContextProvider>
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  }
  return render(<StudentHomePage />, { wrapper: Wrapper });
}

async function selectTab(name: string) {
  await userEvent.click(screen.getByRole('tab', { name }));
  return within(screen.getByRole('tabpanel'));
}

describe('학생 홈 실제 계약 조회', () => {
  it('현재 팀의 실제 자료를 최신 3건씩 표시하고 학번으로 내 담당 액션만 선택한다', async () => {
    renderHome();
    expect(await screen.findByText('팀의 실제 프로젝트')).toBeInTheDocument();
    expect(await screen.findByText('공지 4')).toBeInTheDocument();
    expect(screen.queryByText('공지 1')).not.toBeInTheDocument();
    const meetings = await selectTab('회의록');
    expect(await meetings.findByText('회의 4')).toBeInTheDocument();
    expect(meetings.queryByText('회의 1')).not.toBeInTheDocument();
    expect(
      await meetings.findByText('다른 팀원 · 액션 플랜 6건'),
    ).toBeInTheDocument();
    const actions = await selectTab('액션 플랜');
    expect(await actions.findByText('액션 4')).toBeInTheDocument();
    expect(actions.getAllByRole('link')).toHaveLength(3);
    expect(actions.queryByText('액션 6')).not.toBeInTheDocument();
    expect(actions.queryByText('액션 5')).not.toBeInTheDocument();
    expect(actions.queryByText('액션 1')).not.toBeInTheDocument();
    expect(requests).not.toContain(ENDPOINTS.SECTION.STUDENT_DASHBOARD('2'));
    expect(
      screen.getByText(
        /현재 학생 홈에서는 마일스톤 일정과 진행 상태를 확인할 수 없어요/,
      ),
    ).toBeInTheDocument();
  });

  it('액션 권한 실패가 공지와 프로젝트를 가리지 않고 해당 영역 재시도로 회복한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.ACTIONS('7')}`, () =>
        HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }),
      ),
    );
    renderHome();
    expect(await screen.findByText('공지 4')).toBeInTheDocument();
    expect(await screen.findByText('팀의 실제 프로젝트')).toBeInTheDocument();
    const actions = await selectTab('액션 플랜');
    expect(
      await actions.findByText('액션 플랜 조회에 실패했어요.'),
    ).toBeInTheDocument();
    expect(
      actions.getByText(/이 자료를 조회할 권한이 없어요/),
    ).toBeInTheDocument();
    const meetings = await selectTab('회의록');
    expect(await meetings.findByText('회의 4')).toBeInTheDocument();
    expect(meetings.getAllByText(/액션 수 확인 필요/)).toHaveLength(3);
    const noticeRequestCount = requests.filter(path =>
      path.endsWith('/announcements'),
    ).length;
    server.resetHandlers();
    await selectTab('액션 플랜');
    await userEvent.click(
      screen.getByRole('button', { name: '액션 플랜 다시 시도' }),
    );
    expect(await screen.findByText('액션 4')).toBeInTheDocument();
    expect(
      requests.filter(path => path.endsWith('/announcements')),
    ).toHaveLength(noticeRequestCount);
    await selectTab('회의록');
    expect(
      await screen.findByText('다른 팀원 · 액션 플랜 6건'),
    ).toBeInTheDocument();
  });

  it('느린 액션 조회 중에도 공지와 회의록은 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.ACTIONS('7')}`, async () => {
        await delay('infinite');
        return HttpResponse.json({ contents: [] });
      }),
    );
    renderHome();
    expect(await screen.findByText('공지 4')).toBeInTheDocument();
    const meetings = await selectTab('회의록');
    expect(await meetings.findByText('회의 4')).toBeInTheDocument();
    await selectTab('액션 플랜');
    expect(screen.getByText('액션 플랜 조회 중...')).toBeInTheDocument();
  });

  it('공지의 세션 만료를 구분하고 프로젝트 조회 성공을 유지한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST('2')}`,
        () => HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
      ),
    );
    renderHome();
    expect(
      await screen.findByText(/로그인 상태를 확인한 뒤 다시 로그인/),
    ).toBeInTheDocument();
    expect(await screen.findByText('팀의 실제 프로젝트')).toBeInTheDocument();
    expect(screen.queryByText('등록된 공지가 없어요.')).not.toBeInTheDocument();
  });

  it('회의록 조회가 실패해도 내 담당 액션은 표시한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS('7')}`, () =>
        HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 }),
      ),
    );
    renderHome();
    await selectTab('회의록');
    expect(
      await screen.findByText('회의록 조회에 실패했어요.'),
    ).toBeInTheDocument();
    await selectTab('액션 플랜');
    expect(await screen.findByText('액션 4')).toBeInTheDocument();
  });

  it('팀원 조회 실패는 작성자 학번으로 표시하고 회의록과 액션 건수를 유지한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.KICKOFF('7')}`, () =>
        HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 }),
      ),
    );
    renderHome();
    await selectTab('회의록');
    expect(
      await screen.findByText('작성자 정보 조회에 실패했어요.'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('202600002 · 액션 플랜 6건'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '작성자 정보 다시 시도' }),
    ).toBeEnabled();
  });

  it('성공한 빈 응답은 네트워크 오류와 구분한다', async () => {
    server.use(
      ...[
        ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST('2'),
        ENDPOINTS.MEETING.RECORDS('7'),
        ENDPOINTS.MEETING.ACTIONS('7'),
      ].map(path =>
        http.get(`${API_BASE_URL}${path}`, () =>
          HttpResponse.json({ contents: [] }),
        ),
      ),
    );
    renderHome();
    expect(
      await screen.findByText('등록된 공지가 없어요.'),
    ).toBeInTheDocument();
    await selectTab('회의록');
    expect(
      await screen.findByText('아직 작성된 회의록이 없어요.'),
    ).toBeInTheDocument();
    await selectTab('액션 플랜');
    expect(
      await screen.findByText('내게 배정된 액션 플랜이 없어요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /다시 시도/ }),
    ).not.toBeInTheDocument();
  });

  it('팀 미배정이면 공지만 조회하고 팀 요청 및 회의록 작성을 막는다', async () => {
    useAuthStore.getState().setCurrentUser({ ...liveHomeUser, teamId: null });
    renderHome();
    expect(await screen.findByText('공지 4')).toBeInTheDocument();
    await selectTab('회의록');
    expect(
      screen.getAllByText(/팀 배정이 완료되면 이곳에서 팀 자료/).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '회의록 작성' })).toBeDisabled();
    expect(requests).toEqual([ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST('2')]);
  });

  it.each([
    { sections: [] },
    {
      sections: [
        liveHomeUser.sections[0]!,
        { ...liveHomeUser.sections[0]!, id: '3' },
      ],
    },
  ])('분반을 확정할 수 없으면 모든 홈 요청을 차단한다', ({ sections }) => {
    useAuthStore.getState().setCurrentUser({ ...liveHomeUser, sections });
    renderHome();
    expect(screen.getByText('소속 분반을 확인해 주세요.')).toBeInTheDocument();
    expect(requests).toEqual([]);
  });

  it('서버가 프로젝트 미등록을 명시하면 빈 상태로 구분한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
        HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 }),
      ),
    );
    renderHome();
    expect(
      await screen.findByText('등록된 프로젝트가 없어요.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('프로젝트 조회에 실패했어요.'),
    ).not.toBeInTheDocument();
  });

  it('다른 팀의 프로젝트 응답을 현재 팀 자료로 표시하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
        HttpResponse.json({ id: 21, teamId: 8, title: '다른 팀 프로젝트' }),
      ),
    );
    renderHome();
    await waitFor(() =>
      expect(
        screen.getByText('프로젝트 조회에 실패했어요.'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('다른 팀 프로젝트')).not.toBeInTheDocument();
  });
});
