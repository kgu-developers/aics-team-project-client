import type { AdminMilestoneScheduleResponse } from '@aics/api-client';

export const adminMilestoneScheduleFixture: AdminMilestoneScheduleResponse = {
  sections: [
    {
      sectionId: 'oop-2026-2-01',
      sectionLabel: 'OOP-01',
      memberCountLabel: '48명 / 7팀',
      milestones: [
        { id: 'proposal', title: '제안서', summary: '~10/8\n제출 7팀' },
        { id: 'midterm', title: '중간 점검', summary: '~10/29\n제출 6팀' },
        {
          id: 'presentation-submit',
          title: '발표 자료 제출',
          summary: '~11/12\n제출 6팀',
        },
        {
          id: 'presentation-evaluate',
          title: '발표 평가',
          summary: '~11/19\n제출 2팀',
        },
        {
          id: 'final-report',
          title: '최종 보고서',
          summary: '11/27\n시작 전',
        },
        { id: 'peer-review', title: '상호 평가', summary: '-' },
      ],
      unreadMessageCountLabel: '3건',
    },
  ],
};
