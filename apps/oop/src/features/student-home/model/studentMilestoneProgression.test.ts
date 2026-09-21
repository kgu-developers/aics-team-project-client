import type {
  MyTeamMilestoneSubmissionResponse,
  StudentHomeMilestone,
  StudentMilestoneResponse,
} from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  areAllStudentMilestonesTerminal,
  lockStudentHomeMilestone,
  resolveStudentMilestoneProgression,
} from './studentMilestoneProgression';

const now = Date.parse('2026-10-10T12:00:00+09:00');

function milestone(
  id: number,
  opensAt: string,
  dueAt: string,
): StudentMilestoneResponse {
  return {
    id,
    sectionId: 1,
    title: `단계 ${id}`,
    type: id === 1 ? 'PROPOSAL' : 'MID_REPORT',
    status: 'PUBLISHED',
    weekNumber: id,
    allowResubmissionBeforeDueAt: false,
    schedule: { opensAt, dueAt },
  };
}

function summary(id: number): StudentHomeMilestone {
  return {
    id: String(id),
    title: `단계 ${id}`,
    period: '',
    statusLabel: '진행 중',
    status: 'in-progress',
    dueDate: '',
    interaction: 'collapsible',
    isDetailAvailable: true,
    rows: [
      {
        id: `action-${id}`,
        label: '작성',
        value: '진행',
        tone: 'primary',
        actionLabel: '작성하기',
      },
    ],
    body: {
      kind: 'proposal',
      project: { title: '', description: '' },
      sections: [],
    },
  };
}

function submission(
  milestoneId: number,
  overrides: Partial<MyTeamMilestoneSubmissionResponse> = {},
): MyTeamMilestoneSubmissionResponse {
  return {
    id: milestoneId + 100,
    milestoneId,
    teamId: 7,
    status: 'NOT_SUBMITTED',
    currentVersion: 0,
    canSubmitNow: false,
    hasPendingReview: false,
    ...overrides,
  };
}

describe('학생 마일스톤 순차 진행', () => {
  it('완료와 마감 상태만 남았을 때 학기 전체를 종료 상태로 판단한다', () => {
    expect(
      areAllStudentMilestonesTerminal([
        { ...summary(1), status: 'completed' },
        { ...summary(2), status: 'closed' },
      ]),
    ).toBe(true);
    expect(
      areAllStudentMilestonesTerminal([
        { ...summary(1), status: 'completed' },
        summary(2),
      ]),
    ).toBe(false);
    expect(areAllStudentMilestonesTerminal([])).toBe(false);
  });

  it('이후 일정이 열려도 이전 단계가 완료되지 않으면 잠근다', () => {
    const first = milestone(
      1,
      '2026-09-01T00:00:00+09:00',
      '2026-09-30T23:59:00+09:00',
    );
    const second = milestone(
      2,
      '2026-10-01T00:00:00+09:00',
      '2026-10-31T23:59:00+09:00',
    );
    const result = resolveStudentMilestoneProgression(
      [
        { milestone: first, submission: submission(1), summary: summary(1) },
        {
          milestone: second,
          submission: submission(2, { canSubmitNow: true }),
          summary: summary(2),
        },
      ],
      now,
    );

    expect([...result.unlockedIds]).toEqual(['1']);
    expect(result.defaultOpenId).toBeUndefined();
  });

  it('이전 단계가 조기 완료되면 다음 단계를 열되 일정 전에는 기본으로 펼치지 않는다', () => {
    const result = resolveStudentMilestoneProgression(
      [
        {
          milestone: milestone(
            1,
            '2026-09-01T00:00:00+09:00',
            '2026-09-30T23:59:00+09:00',
          ),
          submission: submission(1, { status: 'COMPLETED' }),
          summary: summary(1),
        },
        {
          milestone: milestone(
            2,
            '2026-11-01T00:00:00+09:00',
            '2026-11-30T23:59:00+09:00',
          ),
          submission: submission(2, { canSubmitNow: true }),
          summary: summary(2),
        },
      ],
      now,
    );

    expect([...result.unlockedIds]).toEqual(['1', '2']);
    expect(result.defaultOpenId).toBeUndefined();
  });

  it('현재 일정 구간의 잠금 해제된 한 단계만 기본으로 선택한다', () => {
    const result = resolveStudentMilestoneProgression(
      [
        {
          milestone: milestone(
            1,
            '2026-09-01T00:00:00+09:00',
            '2026-09-30T23:59:00+09:00',
          ),
          submission: submission(1, { status: 'COMPLETED' }),
          summary: summary(1),
        },
        {
          milestone: milestone(
            2,
            '2026-10-01T00:00:00+09:00',
            '2026-10-31T23:59:00+09:00',
          ),
          submission: submission(2, { canSubmitNow: true }),
          summary: summary(2),
        },
      ],
      now,
    );

    expect(result.defaultOpenId).toBe('2');
  });

  it('완료 이력이 남은 교수 재오픈은 다음 단계를 다시 잠그지 않는다', () => {
    const result = resolveStudentMilestoneProgression(
      [
        {
          milestone: milestone(
            1,
            '2026-09-01T00:00:00+09:00',
            '2026-09-30T23:59:00+09:00',
          ),
          submission: submission(1, {
            status: 'REVISION_REQUESTED',
            canSubmitNow: true,
            completedAt: '2026-09-20T12:00:00+09:00',
          }),
          summary: summary(1),
        },
        {
          milestone: milestone(
            2,
            '2026-10-01T00:00:00+09:00',
            '2026-10-31T23:59:00+09:00',
          ),
          submission: submission(2, { canSubmitNow: true }),
          summary: summary(2),
        },
      ],
      now,
    );

    expect([...result.unlockedIds]).toEqual(['1', '2']);
    expect(result.defaultOpenId).toBe('2');
  });

  it('별도 제출 응답이 없는 상호평가도 요약이 완료되면 다음 단계를 연다', () => {
    const peerSummary = { ...summary(1), status: 'completed' as const };
    const result = resolveStudentMilestoneProgression(
      [
        {
          milestone: milestone(
            1,
            '2026-09-01T00:00:00+09:00',
            '2026-09-30T23:59:00+09:00',
          ),
          summary: peerSummary,
        },
        {
          milestone: milestone(
            2,
            '2026-10-01T00:00:00+09:00',
            '2026-10-31T23:59:00+09:00',
          ),
          submission: submission(2, { canSubmitNow: true }),
          summary: summary(2),
        },
      ],
      now,
    );

    expect([...result.unlockedIds]).toEqual(['1', '2']);
    expect(result.defaultOpenId).toBe('2');
  });

  it('공용 재제출 마감이 지나도 서버가 허용한 교수 재오픈은 현재 단계로 펼친다', () => {
    const reopened = milestone(
      1,
      '2026-09-01T00:00:00+09:00',
      '2026-09-30T23:59:00+09:00',
    );
    reopened.schedule.revisionUntil = '2026-10-05T23:59:00+09:00';
    const result = resolveStudentMilestoneProgression(
      [
        {
          milestone: reopened,
          submission: submission(1, {
            status: 'REVISION_REQUESTED',
            canSubmitNow: true,
          }),
          summary: summary(1),
        },
      ],
      now,
    );

    expect(result.defaultOpenId).toBe('1');
  });

  it('발표 평가의 UTC LocalDateTime 경계를 서울의 같은 순간에 펼친다', () => {
    const presentation = {
      ...milestone(1, '2026-09-01T00:00:00+09:00', '2026-09-30T23:59:00+09:00'),
      type: 'PRESENTATION' as const,
      schedule: {
        dueAt: '2026-09-30T23:59:00+09:00',
        evaluationOpensAt: '2026-10-10T03:00:00',
        evaluationClosesAt: '2026-10-10T04:00:00',
      },
    };

    expect(
      resolveStudentMilestoneProgression(
        [
          {
            milestone: presentation,
            submission: submission(1),
            summary: summary(1),
          },
        ],
        Date.parse('2026-10-10T11:59:59+09:00'),
      ).defaultOpenId,
    ).toBeUndefined();
    expect(
      resolveStudentMilestoneProgression(
        [
          {
            milestone: presentation,
            submission: submission(1),
            summary: summary(1),
          },
        ],
        Date.parse('2026-10-10T12:00:00+09:00'),
      ).defaultOpenId,
    ).toBe('1');
  });

  it('잠긴 단계는 내용을 숨기고 동작을 비활성화한다', () => {
    const locked = lockStudentHomeMilestone(summary(2));
    expect(locked.statusLabel).toBe('이전 단계 완료 필요');
    expect(locked.isDetailAvailable).toBe(false);
    expect(locked.body).toBeUndefined();
    expect(locked.rows[0]).toMatchObject({
      actionDisabled: true,
      actionNotice: '이전 단계를 완료하면 진행할 수 있어요.',
    });
  });

  it('시작 전 단계는 선행 단계가 미완료여도 기간 전 상태를 우선한다', () => {
    const beforePeriod = {
      ...summary(2),
      status: 'before-period' as const,
      statusLabel: '기간 전',
    };
    const locked = lockStudentHomeMilestone(beforePeriod);
    expect(locked.status).toBe('before-period');
    expect(locked.statusLabel).toBe('기간 전');
    expect(locked.currentStepLabel).toBe('기간이 시작되면 진행할 수 있어요.');
    expect(locked.isDetailAvailable).toBe(false);
    expect(locked.body).toBeUndefined();
    expect(locked.rows[0]).toMatchObject({
      actionDisabled: true,
      actionNotice: '기간이 시작되면 진행할 수 있어요.',
    });
  });
});
