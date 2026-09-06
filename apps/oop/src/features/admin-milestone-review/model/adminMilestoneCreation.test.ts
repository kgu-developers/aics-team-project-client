import { describe, expect, it } from 'vitest';

import { createAdminMilestoneCreateInput } from './adminMilestoneCreation';
import { createAdminMilestoneSectionScheduleDraft } from './adminMilestoneSetupDraft';

describe('createAdminMilestoneCreateInput', () => {
  it('확정된 양식과 분반 일정을 생성 API 요청으로 변환한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraft();
    schedule.opensAt = { date: '2026-09-01', time: '09:00' };
    schedule.dueAt = { date: '2026-09-10', time: '23:59' };
    schedule.allowSubmissionEditBeforeDueAt = true;

    expect(
      createAdminMilestoneCreateInput({
        description: ' 제안서를 제출합니다. ',
        schedule,
        templateId: 'proposal',
        title: ' 프로젝트 제안서 ',
        weekNumber: 2,
      }),
    ).toEqual({
      description: '제안서를 제출합니다.',
      schedule: {
        dueAt: '2026-09-10T23:59:00',
        opensAt: '2026-09-01T09:00:00',
        revisionUntil: '2026-09-10T23:59:00',
      },
      title: '프로젝트 제안서',
      type: 'PROPOSAL',
      weekNumber: 2,
    });
  });

  it('지각 제출을 허용하면 지각 제출 마감 일시를 요구한다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraft();
    schedule.dueAt = { date: '2026-09-10', time: '23:59' };
    schedule.allowLateSubmission = true;

    expect(() =>
      createAdminMilestoneCreateInput({
        description: '',
        schedule,
        templateId: 'proposal',
        title: '제안서',
        weekNumber: 2,
      }),
    ).toThrow('지각 제출 마감 일시를 입력해주세요.');
  });

  it('단계 구분이 확정되지 않은 발표 양식은 생성하지 않는다', () => {
    const schedule = createAdminMilestoneSectionScheduleDraft();
    schedule.dueAt = { date: '2026-09-10', time: '23:59' };

    expect(() =>
      createAdminMilestoneCreateInput({
        description: '',
        schedule,
        templateId: 'presentation-submit',
        title: '발표 자료 제출',
        weekNumber: 2,
      }),
    ).toThrow('아직 생성할 수 없는 마일스톤 양식입니다.');
  });
});
