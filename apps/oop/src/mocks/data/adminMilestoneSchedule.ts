import type { AdminMilestoneScheduleResponse } from '@aics/api-client';

import { getAdminMilestoneSummary } from './adminMilestoneDeadlines';

export const adminMilestoneScheduleFixture: AdminMilestoneScheduleResponse = {
  sections: [
    {
      sectionId: 'oop-2026-2-01',
      sectionLabel: 'OOP-01',
      memberCountLabel: '4명 / 2팀',
      milestones: [
        {
          id: 'proposal',
          isPublished: true,
          title: '제안서',
          summary: getAdminMilestoneSummary('proposal', '제출 2팀'),
        },
        {
          id: 'midterm',
          isPublished: true,
          title: '중간 점검',
          summary: getAdminMilestoneSummary('midterm', '제출 2팀'),
        },
        {
          id: 'presentation-submit',
          isPublished: true,
          title: '발표 자료 제출',
          summary: getAdminMilestoneSummary('presentation-submit', '제출 2팀'),
        },
        {
          id: 'presentation-evaluate',
          isPublished: true,
          title: '발표 평가',
          summary: getAdminMilestoneSummary(
            'presentation-evaluate',
            '평가 완료',
          ),
        },
        {
          id: 'final-report',
          isPublished: true,
          title: '최종 보고서',
          summary: getAdminMilestoneSummary('final-report', '제출 2팀'),
        },
        {
          id: 'peer-review',
          isPublished: false,
          title: '상호 평가',
          summary: getAdminMilestoneSummary('peer-review', '제출 1팀'),
        },
      ],
      unreadMessageCountLabel: '3건',
    },
  ],
};
