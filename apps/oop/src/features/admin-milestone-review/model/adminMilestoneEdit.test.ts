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
          lateSubmissionUntil: '2026-09-11T23:59:00',
          opensAt: '2026-09-01T09:00:00',
          revisionUntil: '2026-09-10T23:59:00',
        },
        'PUBLISHED',
      ),
    ).toEqual({
      allowLateSubmission: true,
      allowSubmissionEditBeforeDueAt: true,
      dueAt: { date: '2026-09-10', time: '23:59' },
      isPublished: true,
      lateSubmissionUntil: { date: '2026-09-11', time: '23:59' },
      opensAt: { date: '2026-09-01', time: '09:00' },
    });
  });

  it('수정 요청에는 주차 없이 변경 가능한 내용과 일정을 보낸다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraftFromDto(
      { dueAt: '2026-09-10T23:59:00' },
      'DRAFT',
    );

    expect(
      createAdminMilestoneUpdateInput({
        description: ' 수정한 설명 ',
        schedule,
        title: ' 수정한 제안서 ',
        type: 'PROPOSAL',
      }),
    ).toEqual({
      description: '수정한 설명',
      schedule: { dueAt: '2026-09-10T23:59:00' },
      title: '수정한 제안서',
      type: 'PROPOSAL',
    });
  });
});
