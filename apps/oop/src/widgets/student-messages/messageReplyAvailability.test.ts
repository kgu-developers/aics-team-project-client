import type {
  MyTeamMilestoneSubmissionResponse,
  StudentMilestoneResponse,
} from '@aics/core';
import { describe, expect, it } from 'vitest';

import { messageReplyAvailability } from './messageReplyAvailability';

const now = Date.parse('2026-09-17T13:00:00+09:00');
const milestone: StudentMilestoneResponse = {
  id: 2301,
  sectionId: 2,
  title: '제안서',
  type: 'PROPOSAL',
  status: 'PUBLISHED',
  weekNumber: 3,
  allowResubmissionBeforeDueAt: true,
  schedule: {
    opensAt: '2026-09-01T09:00:00',
    dueAt: '2026-09-20T23:59:59',
  },
};
const submission: MyTeamMilestoneSubmissionResponse = {
  id: 7001,
  milestoneId: 2301,
  teamId: 7,
  status: 'REVISION_REQUESTED',
  currentVersion: 1,
  canSubmitNow: true,
  hasPendingReview: false,
};

function availability({
  item = milestone,
  result = submission,
  relatedType = 'PROPOSAL' as const,
}: {
  item?: StudentMilestoneResponse;
  result?: MyTeamMilestoneSubmissionResponse;
  relatedType?: 'PROPOSAL' | 'GENERAL';
} = {}) {
  return messageReplyAvailability({
    isDemo: false,
    isMilestoneListError: false,
    isMilestoneListPending: false,
    milestones: [item],
    now,
    relatedType,
    submissions: [
      {
        data: result,
        isError: false,
        isPending: false,
        isSuccess: true,
      },
    ],
  });
}

describe('messageReplyAvailability', () => {
  it('서버가 허용한 발송 기간 안에서는 문서 피드백 답장을 허용한다', () => {
    expect(availability()).toEqual({ canReply: true });
  });

  it('문서 피드백 사이클이 완료되면 기간이 남아도 답장을 차단한다', () => {
    expect(
      messageReplyAvailability({
        isDemo: false,
        isFeedbackCycleCompleted: true,
        isMilestoneListError: false,
        isMilestoneListPending: false,
        milestones: [milestone],
        now,
        relatedType: 'PROPOSAL',
        submissions: [
          {
            data: { ...submission, status: 'NOT_SUBMITTED' },
            isError: false,
            isPending: false,
            isSuccess: true,
          },
        ],
      }),
    ).toEqual({
      canReply: false,
      reason: '이미 완료된 단계에는 답장할 수 없습니다.',
    });
  });

  it('서버가 현재 발송을 허용하지 않으면 답장을 차단한다', () => {
    expect(
      availability({ result: { ...submission, canSubmitNow: false } }),
    ).toEqual({
      canReply: false,
      reason: '현재 피드백 답장 가능 기간이 아닙니다.',
    });
  });

  it('마감 이후에는 오래된 canSubmitNow 값이 남아 있어도 답장을 차단한다', () => {
    expect(
      availability({
        item: {
          ...milestone,
          schedule: {
            opensAt: '2026-09-01T09:00:00',
            dueAt: '2026-09-10T23:59:59',
          },
        },
      }),
    ).toEqual({
      canReply: false,
      reason: '현재 피드백 답장 가능 기간이 아닙니다.',
    });
  });

  it('재제출 마감이 있으면 해당 시각까지 피드백 답장을 허용한다', () => {
    expect(
      availability({
        item: {
          ...milestone,
          schedule: {
            opensAt: '2026-09-01T09:00:00',
            dueAt: '2026-09-10T23:59:59',
            revisionUntil: '2026-09-20T23:59:59',
          },
        },
      }),
    ).toEqual({ canReply: true });
  });

  it('일반 메시지 답장은 마일스톤 기간과 무관하게 허용한다', () => {
    expect(
      availability({
        relatedType: 'GENERAL',
        result: { ...submission, canSubmitNow: false },
      }),
    ).toEqual({ canReply: true });
  });

  it('기간 상태를 조회 중이거나 실패한 경우 안전하게 차단한다', () => {
    expect(
      messageReplyAvailability({
        isDemo: false,
        isMilestoneListError: false,
        isMilestoneListPending: true,
        milestones: [],
        now,
        relatedType: 'PROPOSAL',
        submissions: [],
      }),
    ).toEqual({
      canReply: false,
      reason: '피드백 답장 가능 기간을 확인하고 있어요.',
    });
    expect(
      messageReplyAvailability({
        isDemo: false,
        isMilestoneListError: true,
        isMilestoneListPending: false,
        milestones: [],
        now,
        relatedType: 'PROPOSAL',
        submissions: [],
      }),
    ).toEqual({
      canReply: false,
      reason:
        '피드백 답장 가능 기간을 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.',
    });
  });
});
