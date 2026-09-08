import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
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

import { useLiveStudentHomeQuery } from './useLiveStudentHomeQuery';

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
  sessionStorage.clear();
  useAuthStore.getState().setCurrentUser(liveHomeUser);
  useAuthStore.getState().markAuthenticated('STUDENT');
});
afterEach(() => {
  clients.forEach(client => client.clear());
  clients.length = 0;
  requests.length = 0;
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderHomeQuery() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return renderHook(() => useLiveStudentHomeQuery(), { wrapper: Wrapper });
}

describe('학생 홈 개별 API 계약 조회 (UI 연결과 별도 검증)', () => {
  it('문서에 있는 개별 조회를 합성하고 내 학번의 최신 액션만 선택한다', async () => {
    const { result } = renderHomeQuery();
    await waitFor(() =>
      expect(result.current.actions.state.status).toBe('ready'),
    );
    await waitFor(() =>
      expect(result.current.project.data?.title).toBe('팀의 실제 프로젝트'),
    );
    expect(result.current.actions.items.map(item => item.content)).toEqual([
      '액션 4',
      '액션 3',
      '액션 2',
    ]);
    expect(result.current.notices.items.map(item => item.title)).toEqual([
      '공지 4',
      '공지 3',
      '공지 2',
    ]);
    expect(requests).toContain(ENDPOINTS.USER.ME);
    expect(requests).not.toContain(ENDPOINTS.SECTION.STUDENT_DASHBOARD('2'));
  });

  it('액션 403을 빈 목록 성공으로 처리하지 않고 공지 성공을 보존하며 개별 재시도한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.MEETING.ACTIONS('7')}`, () =>
        HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }),
      ),
    );
    const { result } = renderHomeQuery();
    await waitFor(() =>
      expect(result.current.actions.state.status).toBe('error'),
    );
    await waitFor(() =>
      expect(result.current.notices.state.status).toBe('ready'),
    );
    expect(result.current.actions.state.description).toMatch(/권한/);
    const notices = requests.filter(path =>
      path.endsWith('/announcements'),
    ).length;
    server.resetHandlers();
    act(() => result.current.actions.state.onRetry?.());
    await waitFor(() =>
      expect(result.current.actions.state.status).toBe('ready'),
    );
    expect(
      requests.filter(path => path.endsWith('/announcements')),
    ).toHaveLength(notices);
  });

  it('팀 미배정이면 팀 API를 요청하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
        HttpResponse.json({
          studentNumber: liveHomeUser.studentNumber,
          name: liveHomeUser.name,
          email: liveHomeUser.email,
          globalRole: 'USER',
          sections: [{ id: 2, code: 'OOP-2', name: '테스트 분반' }],
          teamId: null,
        }),
      ),
    );
    const { result } = renderHomeQuery();
    await waitFor(() =>
      expect(result.current.notices.state.status).toBe('ready'),
    );
    expect(result.current.actions.state.status).toBe('missing');
    expect(requests.some(path => path.includes('/teams/'))).toBe(false);
  });

  it('/me 실패 시 이전 로그인 정보로 팀 요청을 보내지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.USER.ME}`, () =>
        HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }),
      ),
    );
    const { result } = renderHomeQuery();
    await waitFor(() => expect(result.current.identity.isError).toBe(true));
    expect(result.current.actions.state.status).toBe('error');
    expect(result.current.notices.state.status).toBe('error');
    expect(requests.some(path => path.includes('/teams/'))).toBe(false);
    expect(requests.some(path => path.endsWith('/announcements'))).toBe(false);
  });

  it('다른 팀의 프로젝트 응답을 현재 팀 자료로 표시하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
        HttpResponse.json({ id: 21, teamId: 8, title: '다른 팀 프로젝트' }),
      ),
    );
    const { result } = renderHomeQuery();
    await waitFor(() =>
      expect(result.current.project.state.status).toBe('error'),
    );
    expect(result.current.project.data).toBeUndefined();
  });

  it('프로젝트 미등록 404를 일반 조회 실패와 구분한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT.BY_TEAM('7')}`, () =>
        HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 }),
      ),
    );
    const { result } = renderHomeQuery();
    await waitFor(() =>
      expect(result.current.project.state.status).toBe('ready'),
    );
    expect(result.current.project.data).toBeNull();
  });
});
