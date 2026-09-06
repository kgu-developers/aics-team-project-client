import { describe, expect, it } from 'vitest';

import {
  createAdminMilestoneSectionScheduleDraftFromDto,
  createAdminMilestoneUpdateInput,
} from './adminMilestoneEdit';

describe('adminMilestoneEdit', () => {
  it('조회한 일정과 공개 상태를 수정 폼 초깃값으로 변환한다', () => {
    expect(
      createAdminMilestoneSectionScheduleDraftFromDto(
        {
          dueAt: '2026-09-10T23:59:00',
          evaluationClosesAt: '2026-09-14T23:59:00',
          evaluationOpensAt: '2026-09-12T09:00:00',
          lateSubmissionUntil: '2026-09-11T23:59:00',
          opensAt: '2026-09-01T09:00:00',
          revisionUntil: '2026-09-10T23:59:00',
        },
        'PUBLISHED',
        false,
      ),
    ).toEqual({
      allowLateSubmission: true,
      allowSubmissionEditBeforeDueAt: false,
      dueAt: { date: '2026-09-10', time: '23:59' },
      evaluationClosesAt: { date: '2026-09-14', time: '23:59' },
      evaluationOpensAt: { date: '2026-09-12', time: '09:00' },
      isPublished: true,
      lateSubmissionUntil: { date: '2026-09-11', time: '23:59' },
      opensAt: { date: '2026-09-01', time: '09:00' },
    });
  });

  it('수정 요청에는 주차 없이 변경 가능한 내용과 일정을 보낸다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      { dueAt: '2026-09-10T23:59:00' },
      'DRAFT',
      false,
    );

    expect(
      createAdminMilestoneUpdateInput({
        description: ' 수정한 설명 ',
        schedule,
        title: ' 수정한 제안서 ',
        type: 'PROPOSAL',
      }),
    ).toEqual({
      allowResubmissionBeforeDueAt: false,
      description: '수정한 설명',
      schedule: { dueAt: '2026-09-10T23:59:00' },
      title: '수정한 제안서',
      type: 'PROPOSAL',
    });
  });

  it('지각 제출 마감일이 일반 제출 마감일보다 빠르면 수정하지 않는다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-09-10T23:59:00',
        lateSubmissionUntil: '2026-09-10T23:59:00',
      },
      'DRAFT',
      false,
    );

    expect(() =>
      createAdminMilestoneUpdateInput({
        description: '',
        schedule,
        title: '제안서',
        type: 'PROPOSAL',
      }),
    ).toThrow('지각 제출 마감 일시는 제출 마감 일시보다 뒤여야 합니다.');
  });

  it('발표 평가는 평가 기간을 기본 운영 기간에도 함께 저장한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      {
        dueAt: '2026-11-25T18:00:00',
        evaluationClosesAt: '2026-11-25T18:00:00',
        evaluationOpensAt: '2026-11-21T09:00:00',
        opensAt: '2026-11-21T09:00:00',
      },
      'DRAFT',
      false,
    );

    expect(
      createAdminMilestoneUpdateInput({
        description: '발표 평가',
        schedule,
        title: '발표 평가',
        type: 'PRESENTATION',
      }),
    ).toMatchObject({
      schedule: {
        dueAt: '2026-11-25T18:00:00',
        evaluationClosesAt: '2026-11-25T18:00:00',
        evaluationOpensAt: '2026-11-21T09:00:00',
        opensAt: '2026-11-21T09:00:00',
      },
    });
  });
});
