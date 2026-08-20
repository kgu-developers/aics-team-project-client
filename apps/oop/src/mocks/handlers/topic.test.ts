import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { TopicBoard } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { topicHandlers } from './topic';
import { resetTopicMockData } from '../data/topic';
import { demoAccessToken, demoPartnerAccessToken } from '../data/users';

const sectionId = 'oop-2026-2-01';
const headers = { Authorization: `Bearer ${demoAccessToken}` };
const server = setupServer(...topicHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetTopicMockData();
  server.resetHandlers();
});
afterAll(() => server.close());

async function fetchBoard() {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(sectionId)}`,
    { headers },
  );
  return { response, board: (await response.json()) as TopicBoard };
}

describe('topicHandlers', () => {
  it('후보를 여러 개 등록할 수 있다', async () => {
    const created = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(sectionId)}`,
      {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '스터디 매칭',
          description: '관심 분야별 스터디를 연결합니다.',
        }),
      },
    );
    const board = (await created.json()) as TopicBoard;
    const mine = board.candidates.find(
      candidate => candidate.title === '스터디 매칭',
    );

    expect(created.status).toBe(200);
    expect(mine).toMatchObject({ isMine: true, teamId: 'team-07' });
  });

  it('내 후보가 아닌 후보가 선택된 초기 투표 상태를 제공한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(sectionId)}`,
      { headers: { Authorization: `Bearer ${demoPartnerAccessToken}` } },
    );
    const board = (await response.json()) as TopicBoard;

    expect(
      board.candidates.find(candidate => candidate.id === 'topic-1'),
    ).toMatchObject({ isMine: true, isMyVote: false });
    expect(
      board.candidates.find(candidate => candidate.id === 'topic-2'),
    ).toMatchObject({ isMine: false, isMyVote: true });
  });

  it('투표하지 않은 팀원도 후보를 선택하면 투표되고, 이후 후보를 변경할 수 있다', async () => {
    const initial = await fetchBoard();
    expect(initial.board.candidates.some(candidate => candidate.isMyVote)).toBe(
      false,
    );

    const firstVote = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(sectionId)}`,
      {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: 'topic-1' }),
      },
    );
    const beforeChange = (await firstVote.json()) as TopicBoard;
    const beforeVote = beforeChange.candidates.find(
      candidate => candidate.id === 'topic-1',
    )!;
    const changed = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(sectionId)}`,
      {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: 'topic-3' }),
      },
    );
    const changedBoard = (await changed.json()) as TopicBoard;
    const cancelled = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(sectionId)}`,
      { method: 'DELETE', headers },
    );
    const cancelledBoard = (await cancelled.json()) as TopicBoard;

    expect(
      changedBoard.candidates.find(candidate => candidate.id === 'topic-1')
        ?.voteCount,
    ).toBe(beforeVote.voteCount - 1);
    expect(
      changedBoard.candidates.find(candidate => candidate.id === 'topic-3'),
    ).toMatchObject({ isMyVote: true });
    expect(
      cancelledBoard.candidates.some(candidate => candidate.isMyVote),
    ).toBe(false);
    expect(cancelledBoard.participation).toMatchObject({
      votedMemberCount: 3,
      totalMemberCount: 5,
    });
  });

  it('인증되지 않았거나 다른 분반이면 보드를 반환하지 않는다', async () => {
    const unauthorized = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(sectionId)}`,
    );
    const nonTeam = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD('other-section')}`,
      { headers },
    );

    expect(unauthorized.status).toBe(401);
    expect(nonTeam.status).toBe(403);
  });

  it('자신이 등록한 후보에는 투표할 수 없다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(sectionId)}`,
      {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: 'topic-2' }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: 'SELF_VOTE_NOT_ALLOWED',
    });
  });

  it('없는 후보 투표는 404를 반환한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.VOTE(sectionId)}`,
      {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: 'missing-candidate' }),
      },
    );

    expect(response.status).toBe(404);
  });
});
