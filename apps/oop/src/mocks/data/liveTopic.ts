import type { TopicCandidatePersistResponse } from '@aics/core';

export const liveTopicTeamId = '4';
export const liveTopicMemberNumbers = ['20260001', '20260003', '20260004'];

export function createLiveTopicState() {
  return {
    candidates: [
      {
        id: 1,
        proposerUserId: '20260003',
        title: '도서 대여 관리',
        description: '도서와 대여 현황을 관리합니다.',
      },
      {
        id: 2,
        proposerUserId: '20260004',
        title: '카페 주문 관리',
        description: '주문과 결제 현황을 관리합니다.',
      },
    ] satisfies TopicCandidatePersistResponse[],
    votes: new Map<string, number>(),
    nextId: 3,
  };
}
