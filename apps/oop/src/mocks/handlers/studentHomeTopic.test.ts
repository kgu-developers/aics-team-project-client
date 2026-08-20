import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { StudentHomeDashboard, TopicBoard } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { studentHomeHandlers } from './studentHome';
import { topicHandlers } from './topic';
import { resetTopicMockData } from '../data/topic';
import { demoAccessToken } from '../data/users';

const sectionId = 'oop-2026-2-01';
const headers = { Authorization: `Bearer ${demoAccessToken}` };
const server = setupServer(...topicHandlers, ...studentHomeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetTopicMockData();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('studentHome topic summary', () => {
  it('후보 등록 후 홈 요약도 같은 후보 상태를 반환한다', async () => {
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

    const homeResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(sectionId)}`,
      { headers },
    );
    const home = (await homeResponse.json()) as StudentHomeDashboard;
    const topicBody = home.milestones.find(
      milestone => milestone.id === 'proposal',
    )?.body;

    expect(created.status).toBe(200);
    expect(
      board.candidates.find(candidate => candidate.title === '스터디 매칭'),
    ).toMatchObject({ isMine: true, teamId: 'team-07' });
    expect(topicBody).toMatchObject({ kind: 'topic' });
    expect(
      topicBody?.kind === 'topic' && topicBody.topicCandidates,
    ).toContainEqual(
      expect.objectContaining({ title: '스터디 매칭', isMine: true }),
    );
  });
});
