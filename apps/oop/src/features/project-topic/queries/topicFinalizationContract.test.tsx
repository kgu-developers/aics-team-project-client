import {
  API_BASE_URL,
  fetchTeamProject,
  updateTopicFinalization,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { studentHomeKeys } from '~/features/student-home/queries';

import { topicKeys } from './topicKeys';
import { useUpdateTopicFinalizationMutation } from './useUpdateTopicFinalizationMutation';

const url = `${API_BASE_URL}/api/v1/teams/4/topic-finalize`;
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('확정은 팀 PATCH에 숫자 후보ID와 trim된 목표를 보내고 receipt만 반환한다', async () => {
  server.use(
    http.patch(url, async ({ request }) => {
      expect(await request.json()).toEqual({ candidateId: 3, goal: '팀 목표' });
      return HttpResponse.json({
        projectId: 12,
        candidateId: 3,
        title: '확정 후보',
      });
    }),
  );
  expect(
    await updateTopicFinalization('4', { candidateId: 3, goal: '  팀 목표  ' }),
  ).toEqual({ projectId: 12, candidateId: 3, title: '확정 후보' });
});

it.each(['', '0', '../4', '9007199254740993'])(
  '잘못된 팀 ID %s로 확정 요청을 보내지 않는다',
  async teamId => {
    await expect(
      updateTopicFinalization(teamId, { candidateId: 1, goal: '목표' }),
    ).rejects.toThrow('식별자');
  },
);
it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
  '잘못된 후보 ID %s로 확정 요청을 보내지 않는다',
  async candidateId => {
    await expect(
      updateTopicFinalization('4', { candidateId, goal: '목표' }),
    ).rejects.toThrow('식별자');
  },
);
it('빈 목표를 서버로 보내지 않는다', async () => {
  await expect(
    updateTopicFinalization('4', { candidateId: 1, goal: '  ' }),
  ).rejects.toThrow('목표');
});
it.each([
  { projectId: Number.MAX_SAFE_INTEGER + 1, candidateId: 1, title: '후보' },
  { projectId: 12, candidateId: 2, title: '후보' },
  { projectId: 12, candidateId: 1, title: '' },
])('불명확한 receipt로 프로젝트를 연결하지 않는다: %o', async result => {
  server.use(http.patch(url, () => HttpResponse.json(result)));
  await expect(
    updateTopicFinalization('4', { candidateId: 1, goal: '목표' }),
  ).rejects.toThrow('결과');
});

it('확정 뒤 현재 팀·분반·프로젝트만 갱신하고 다른 팀 캐시는 유지한다', async () => {
  server.use(
    http.patch(url, () =>
      HttpResponse.json({ projectId: 12, candidateId: 1, title: '후보' }),
    ),
  );
  const client = new QueryClient();
  const affected = [
    topicKeys.candidates('4', '20260001', '1'),
    studentHomeKeys.dashboard('1'),
    ['student-project', '4'],
  ];
  const retained = [
    topicKeys.candidates('5', '20260001', '2'),
    studentHomeKeys.dashboard('2'),
    ['student-project', '5'],
    ['team-kickoff', '5'],
  ];
  [...affected, ...retained].forEach(key =>
    client.setQueryData(key, { existing: true }),
  );
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  const hook = renderHook(
    () => useUpdateTopicFinalizationMutation('4', '1', '20260001'),
    { wrapper: Wrapper },
  );
  try {
    await act(async () => {
      await hook.result.current.mutateAsync({ candidateId: 1, goal: '목표' });
    });
    affected.forEach(key =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(true),
    );
    retained.forEach(key => {
      expect(client.getQueryState(key)?.isInvalidated).toBe(false);
      expect(client.getQueryData(key)).toEqual({ existing: true });
    });
    expect(client.getQueryData(['student-project', '4'])).toEqual({
      existing: true,
    });
  } finally {
    hook.unmount();
    client.clear();
  }
});

it.each([{ goal: {} }, { proposalCompletedAt: true }])(
  '잘못된 프로젝트 목표/완료 상태를 UI에 전달하지 않는다: %o',
  async extra => {
    server.use(
      http.get(`${API_BASE_URL}/api/v1/teams/4/project`, () =>
        HttpResponse.json({ id: 12, teamId: 4, ...extra }),
      ),
    );
    await expect(fetchTeamProject('4')).rejects.toThrow('목표와 완료 상태');
  },
);
