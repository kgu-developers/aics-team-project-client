import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import type { StudentMilestoneResponse } from '@aics/core';
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

import { useStudentMilestonesQuery } from './useStudentMilestonesQuery';

import { getMockMySections } from '~/mocks/data/sections';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { studentMilestoneHandlers } from '~/mocks/handlers/studentMilestones';

const milestone: StudentMilestoneResponse = {
  id: 301,
  sectionId: 2,
  title: '제안서',
  type: 'PROPOSAL',
  status: 'PUBLISHED',
  weekNumber: 3,
  schedule: { opensAt: '2026-09-01T09:00:00', dueAt: '2026-09-15T23:59:00' },
  allowResubmissionBeforeDueAt: true,
};
const requests: string[] = [];
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
    HttpResponse.json({ contents: [milestone] }),
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION('301')}`,
    () =>
      HttpResponse.json({
        id: 401,
        milestoneId: 301,
        teamId: 7,
        status: 'REVISION_REQUESTED',
        currentVersion: 2,
        canSubmitNow: true,
        hasPendingReview: false,
      }),
  ),
);
let client: QueryClient;
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    requests.push(new URL(request.url).pathname),
  );
});
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  client.clear();
  setApiAccessToken(null);
  server.resetHandlers();
  requests.length = 0;
});
afterAll(() => server.close());
function renderMilestones(sectionId?: string, teamId?: string) {
  return renderHook(() => useStudentMilestonesQuery(sectionId, teamId), {
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
}
describe('학생 마일스톤 목록과 내 팀 제출 조회', () => {
  it('브라우저 MSW도 학생 목록과 내 팀 제출 응답을 제공한다', async () => {
    server.use(...studentMilestoneHandlers);
    setApiAccessToken(demoAccessToken);
    const section = getMockMySections(demoStudent.studentNumber, {
      status: 'ACTIVE',
    })[0]!;
    const { result } = renderMilestones(String(section.id), '7');
    await waitFor(() => expect(result.current.submissions).toHaveLength(5));
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.error).toBeFalsy();
    expect(
      result.current.submissions.every((query, index) =>
        result.current.milestones[index]?.type === 'PEER_EVALUATION'
          ? query.data === undefined && !query.isFetching
          : query.data?.teamId === 7,
      ),
    ).toBe(true);
  });
  it('브라우저 MSW는 타 분반의 목록을 거부한다', async () => {
    server.use(...studentMilestoneHandlers);
    setApiAccessToken(demoAccessToken);
    const { result } = renderMilestones('999999', '7');
    await waitFor(() => expect(result.current.list.isError).toBe(true));
    expect(result.current.submissions).toHaveLength(0);
  });
  it('목록이 반환한 실제 ID로 제출 상태·숫자 버전·제출 가능 여부를 조회한다', async () => {
    const { result } = renderMilestones('2', '7');
    await waitFor(() =>
      expect(result.current.submissions[0]?.isSuccess).toBe(true),
    );
    expect(result.current.milestones[0]?.schedule.dueAt).toBe(
      milestone.schedule.dueAt,
    );
    expect(result.current.submissions[0]?.data).toMatchObject({
      status: 'REVISION_REQUESTED',
      currentVersion: 2,
      canSubmitNow: true,
    });
    expect(requests).toEqual([
      ENDPOINTS.STUDENT_MILESTONE.LIST('2'),
      ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION('301'),
    ]);
  });
  it('상호평가만 있으면 팀 문서 제출을 조회하지 않고 목록 로딩을 마친다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
        HttpResponse.json({
          contents: [{ ...milestone, type: 'PEER_EVALUATION' }],
        }),
      ),
    );
    const { result } = renderMilestones('2', '7');
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(requests).toEqual([ENDPOINTS.STUDENT_MILESTONE.LIST('2')]);
  });
  it('분반이 없으면 조회하지 않는다', () => {
    renderMilestones(undefined, '7');
    expect(requests).toEqual([]);
  });
  it('팀이 없으면 목록만 조회한다', async () => {
    const { result } = renderMilestones('2');
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true));
    expect(requests).toEqual([ENDPOINTS.STUDENT_MILESTONE.LIST('2')]);
    expect(result.current.isPending).toBe(false);
  });
  it('다른 분반의 목록은 거부하고 제출 상태를 조회하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.LIST('2')}`, () =>
        HttpResponse.json({ contents: [{ ...milestone, sectionId: 3 }] }),
      ),
    );
    const { result } = renderMilestones('2', '7');
    await waitFor(() => expect(result.current.list.isError).toBe(true));
    expect(requests).toHaveLength(1);
  });
  it('제출 조회 실패를 미제출로 바꾸지 않고 해당 요청만 재시도한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION('301')}`,
        () => HttpResponse.json({}, { status: 403 }),
      ),
    );
    const { result } = renderMilestones('2', '7');
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.submissions[0]?.data).toBeUndefined();
    server.resetHandlers();
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() =>
      expect(result.current.submissions[0]?.isSuccess).toBe(true),
    );
    expect(
      requests.filter(path => path === ENDPOINTS.STUDENT_MILESTONE.LIST('2')),
    ).toHaveLength(1);
  });
});
