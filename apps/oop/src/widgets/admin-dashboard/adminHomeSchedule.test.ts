import type { AdminSectionMilestoneDto } from '@aics/api-client';
import { describe, expect, it } from 'vitest';

import {
  formatAdminHomeScheduleDate,
  getAdminHomeDeadlineLabel,
  getAdminHomeMilestones,
  getAdminHomePresentationEvaluationState,
  getAdminHomeScheduleRefreshAt,
} from './adminHomeSchedule';

const now = Date.parse('2026-10-10T10:00:00+09:00');

function milestone(
  id: number,
  dueAt: string | null,
  status: AdminSectionMilestoneDto['status'] = 'PUBLISHED',
): AdminSectionMilestoneDto {
  return {
    allowResubmissionBeforeDueAt: false,
    id,
    peerEvaluationForm: null,
    schedule: { dueAt },
    sectionId: 1,
    status,
    title: `마일스톤 ${id}`,
    type: 'MID_REPORT',
    weekNumber: id,
  };
}

describe('adminHomeSchedule', () => {
  it.each([
    ['2026-10-12T23:59:00', '~ 10.12 23:59'],
    ['2026-10-12T14:59:00Z', '~ 10.12 23:59'],
    [null, '마감일 미정'],
    ['잘못된 날짜', '마감일 미정'],
  ])(
    '서울 시간 기준으로 홈 일정 날짜를 간결하게 표시한다: %s',
    (dueAt, expected) => {
      expect(formatAdminHomeScheduleDate(dueAt)).toBe(expected);
    },
  );

  it.each([
    [null, null, 'PUBLISHED', '기간 미정'],
    ['2026-10-27T15:00:00', '2026-10-27T18:00:00', 'PUBLISHED', '시작 전'],
    ['2026-10-10T09:00:00', '2026-10-10T18:00:00', 'PUBLISHED', '진행 중'],
    ['2026-10-09T09:00:00', '2026-10-10T09:00:00', 'PUBLISHED', '종료'],
    ['2026-10-27T15:00:00', '2026-10-27T18:00:00', 'DRAFT', '시작 전'],
    ['2026-10-27T15:00:00', '2026-10-27T18:00:00', 'CLOSED', '종료'],
  ] as const)(
    '발표 평가 기간·공개 상태를 홈 상태로 요약한다: %s %s %s',
    (startsAt, endsAt, milestoneStatus, expected) => {
      expect(
        getAdminHomePresentationEvaluationState({
          endsAt,
          milestoneStatus,
          now,
          startsAt,
        }),
      ).toBe(expected);
    },
  );

  it.each([
    ['2026-10-10T23:59:00', '오늘 마감'],
    ['2026-10-10T09:59:59', '마감'],
    ['2026-10-11T00:01:00', 'D-1'],
    [null, '일정 미정'],
    ['잘못된 날짜', '일정 미정'],
  ])('서울 시간 기준 마감 상태를 표시한다: %s', (dueAt, expected) => {
    expect(getAdminHomeDeadlineLabel(dueAt, now)).toBe(expected);
  });

  it('삭제되어 서버 목록에서 빠진 항목 외에는 상태와 일정에 관계없이 모두 표시한다', () => {
    const displayed = getAdminHomeMilestones([
      milestone(3, null, 'CLOSED'),
      milestone(1, '2026-10-09T23:59:00', 'PUBLISHED'),
      milestone(2, '2026-10-12T23:59:00', 'DRAFT'),
    ]);

    expect(displayed.map(item => item.id)).toEqual([1, 2, 3]);
  });

  it('마감일이 아니라 주차 순서로 정렬하고 같은 주차에서는 id 순서를 사용한다', () => {
    const lateDueFirst = {
      ...milestone(30, '2026-12-30T23:59:00'),
      weekNumber: 2,
    };
    const earlyDueLast = {
      ...milestone(10, '2026-10-01T23:59:00'),
      weekNumber: 8,
    };
    const sameWeekLowerId = {
      ...milestone(20, '2026-11-01T23:59:00'),
      weekNumber: 2,
    };

    expect(
      getAdminHomeMilestones([earlyDueLast, lateDueFirst, sameWeekLowerId]).map(
        item => item.id,
      ),
    ).toEqual([20, 30, 10]);
  });

  it('발표 자료 제출 마감은 유지하고 발표 평가 전용 일정은 제외한다', () => {
    const presentationSubmission = {
      ...milestone(10, '2026-10-20T18:00:00'),
      schedule: {
        dueAt: '2026-10-20T18:00:00',
        evaluationClosesAt: '2026-10-27T18:00:00',
        evaluationOpensAt: '2026-10-27T15:00:00',
      },
      title: '발표',
      type: 'PRESENTATION' as const,
    };
    const presentationEvaluationOnly = {
      ...milestone(11, '2026-10-27T18:00:00'),
      schedule: {
        dueAt: '2026-10-27T18:00:00',
        evaluationClosesAt: '2026-10-27T18:00:00',
        evaluationOpensAt: '2026-10-27T15:00:00',
      },
      title: '발표 평가',
      type: 'PRESENTATION' as const,
    };

    expect(
      getAdminHomeMilestones([
        presentationEvaluationOnly,
        presentationSubmission,
      ]).map(item => item.id),
    ).toEqual([10]);
  });

  it('가장 가까운 마감 시각과 다음 서울 자정 중 먼저 오는 때를 갱신 시점으로 사용한다', () => {
    expect(
      getAdminHomeScheduleRefreshAt(
        ['2026-10-10T15:00:00', '2026-10-11T12:00:00'],
        now,
      ),
    ).toBe(Date.parse('2026-10-10T15:00:00+09:00'));
    expect(getAdminHomeScheduleRefreshAt([], now)).toBe(
      Date.parse('2026-10-11T00:00:00+09:00'),
    );
  });
});
