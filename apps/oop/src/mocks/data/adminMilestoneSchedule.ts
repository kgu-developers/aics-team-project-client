import type { AdminMilestoneScheduleResponse } from '@aics/api-client';

import { adminPresentationEvaluationPeriodFixture } from './adminPresentationEvaluations';

export const adminMilestoneScheduleFixture: AdminMilestoneScheduleResponse = {
  sections: [
    {
      sectionId: 'oop-2026-2-01',
      sectionLabel: 'OOP-01',
      memberCountLabel: '4명 / 2팀',
      milestones: [
        { id: 'proposal', title: '제안서', summary: '~08/24\n제출 2팀' },
        { id: 'midterm', title: '중간 점검', summary: '~10/15\n제출 2팀' },
        {
          id: 'presentation-submit',
          title: '발표 자료 제출',
          summary: '~11/12\n제출 2팀',
        },
        {
          id: 'presentation-evaluate',
          title: '발표 평가',
          summary: `~${adminPresentationEvaluationPeriodFixture.endsAt.slice(0, 10).replaceAll('-', '/')}\n평가 완료`,
        },
        {
          id: 'final-report',
          title: '최종 보고서',
          summary: '~12/07\n제출 2팀',
        },
        { id: 'peer-review', title: '상호 평가', summary: '~08/30\n제출 1팀' },
      ],
      unreadMessageCountLabel: '3건',
    },
  ],
};
