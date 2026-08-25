import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { StudentHomeDashboard, TopicBoard } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { studentHomeHandlers } from './studentHome';
import { topicHandlers } from './topic';
import {
  completeProposalBlock,
  getCurrentProposal,
  resetProposalFixture,
  submitCurrentProposal,
} from '../data/proposal';
import { resetTopicMockData } from '../data/topic';
import { demoAccessToken } from '../data/users';

const sectionId = 'oop-2026-2-01';
const headers = { Authorization: `Bearer ${demoAccessToken}` };
const server = setupServer(...topicHandlers, ...studentHomeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetProposalFixture();
  resetTopicMockData();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('studentHome topic summary', () => {
  it('주제가 서버에서 선정되면 후보 등록 대신 제안서 작성 상태를 반환한다', async () => {
    const boardResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.TOPIC.BOARD(sectionId)}`,
      { headers },
    );
    const board = (await boardResponse.json()) as TopicBoard;

    const homeResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(sectionId)}`,
      { headers },
    );
    const home = (await homeResponse.json()) as StudentHomeDashboard;
    const topicBody = home.milestones.find(
      milestone => milestone.id === 'proposal',
    )?.body;

    expect(boardResponse.status).toBe(200);
    expect(board.selection).toMatchObject({
      status: 'SELECTED',
      selectedCandidateId: 'topic-1',
    });
    expect(topicBody).toMatchObject({
      kind: 'proposal',
      project: expect.objectContaining({
        title: 'CineFlow · 영화관 통합 관리 시스템',
      }),
    });
    expect(
      home.milestones.find(milestone => milestone.id === 'proposal')?.rows[0],
    ).toMatchObject({
      label: '제안서 작성',
      actionLabel: '작성하기',
    });
  });

  it('제출 뒤 아코디언 상세와 작성 CTA를 읽기 전용 상태로 투영한다', async () => {
    let proposal = getCurrentProposal();
    for (const block of proposal.blocks.filter(
      block => block.status !== 'COMPLETED',
    )) {
      const completed = completeProposalBlock(
        block.key,
        proposal.version,
        'OOP 데모 학생 A',
      );
      if (!completed)
        throw new Error('proposal completion fixture is required');
      proposal = completed;
    }
    submitCurrentProposal(proposal.version, 'OOP 데모 학생 A');

    const homeResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD(sectionId)}`,
      { headers },
    );
    const home = (await homeResponse.json()) as StudentHomeDashboard;
    const proposalMilestone = home.milestones.find(
      milestone => milestone.id === 'proposal',
    );

    expect(proposalMilestone).toMatchObject({
      status: 'completed',
      statusLabel: '완료',
      currentStepLabel: '제출 완료',
    });
    expect(proposalMilestone?.body).toMatchObject({
      kind: 'proposal',
      sections: expect.arrayContaining([
        expect.objectContaining({
          status: 'completed',
          statusLabel: '작성 완료',
        }),
      ]),
    });
    expect(proposalMilestone?.rows[0]).toMatchObject({
      value: '제출 완료',
      actionLabel: '제출 완료',
      actionDisabled: true,
    });
  });
});
