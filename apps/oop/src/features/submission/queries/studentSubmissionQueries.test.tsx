import { API_BASE_URL } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useStudentSubmissionQuery } from './useStudentSubmissionQuery';
import { useStudentSubmissionVersionQuery } from './useStudentSubmissionVersionQuery';
import { useStudentSubmissionVersionsQuery } from './useStudentSubmissionVersionsQuery';

import {
  studentSubmission,
  studentSubmissionScope as scope,
} from '~/mocks/data/studentSubmissionScenarios';
import { createStudentSubmissionHandlers } from '~/mocks/handlers/studentSubmissionScenarios';

const server = setupServer(...createStudentSubmissionHandlers());
const requests: string[] = [];
const clients: QueryClient[] = [];
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  server.events.on('request:start', ({ request }) =>
    requests.push(request.url),
  );
});
afterEach(() => {
  cleanup();
  clients.forEach(client => client.clear());
  clients.length = 0;
  requests.length = 0;
  server.resetHandlers();
});
afterAll(() => server.close());
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return { client, wrapper: Wrapper };
}

describe('학생 제출 조회 쿼리', () => {
  it('팀 정보가 없거나 0버전이면 요청하지 않는다', () => {
    const { wrapper } = setup();
    const { result } = renderHook(
      () => ({
        detail: useStudentSubmissionQuery(
          { ...scope, teamId: undefined },
          '31',
        ),
        versions: useStudentSubmissionVersionsQuery(scope, undefined),
        version: useStudentSubmissionVersionQuery(scope, '31', 0),
      }),
      { wrapper },
    );
    expect(result.current.detail.fetchStatus).toBe('idle');
    expect(result.current.versions.fetchStatus).toBe('idle');
    expect(result.current.version.fetchStatus).toBe('idle');
    expect(requests).toHaveLength(0);
  });
  it('다른 팀으로 전환하면 이전 상세를 노출하지 않고 불일치를 거절한다', async () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ teamId }) => useStudentSubmissionQuery({ ...scope, teamId }, '31'),
      { wrapper, initialProps: { teamId: '7' } },
    );
    await waitFor(() => expect(result.current.data?.id).toBe(31));
    rerender({ teamId: '8' });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
  it('상세 결과로 같은 제출의 홈 캐시를 갱신하고 홈 API는 재요청하지 않는다', async () => {
    const { client, wrapper } = setup();
    const homeKey = ['student-home', 'submission', '1', '7', 11];
    client.setQueryData(
      homeKey,
      { ...studentSubmission, status: 'NOT_SUBMITTED' },
      { updatedAt: 1 },
    );
    renderHook(() => useStudentSubmissionQuery(scope, '31'), { wrapper });
    await waitFor(() =>
      expect(client.getQueryData(homeKey)).toMatchObject({
        status: 'SUBMITTED',
      }),
    );
    expect(requests).toHaveLength(1);
    expect(requests[0]).toContain('/submissions/31');
  });
  it('현재·과거 버전 파일을 각각 조회하고 재조회로 만료 링크를 갱신한다', async () => {
    const { wrapper } = setup();
    const { result, rerender } = renderHook(
      ({ version }) => useStudentSubmissionVersionQuery(scope, '31', version),
      { wrapper, initialProps: { version: 2 } },
    );
    await waitFor(() => expect(result.current.data?.version).toBe(2));
    rerender({ version: 1 });
    await waitFor(() =>
      expect(result.current.data?.artifacts[0]?.fileName).toBe('발표-v1.pdf'),
    );
    const oldUrl = result.current.data?.artifacts[0]?.downloadUrl;
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() =>
      expect(result.current.data?.artifacts[0]?.downloadUrl).not.toBe(oldUrl),
    );
  });
  it('미제출의 빈 이력을 정상 결과로 반환한다', async () => {
    server.use(...createStudentSubmissionHandlers({ versions: [] }));
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useStudentSubmissionVersionsQuery(scope, '31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
  it('권한 오류를 재시도하지 않는다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/submissions/31`,
        () => new HttpResponse(null, { status: 403 }),
      ),
    );
    const { wrapper } = setup();
    const { result } = renderHook(
      () => useStudentSubmissionQuery(scope, '31'),
      { wrapper },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(requests).toHaveLength(1);
  });
});
