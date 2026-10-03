import type { AdminRosterImportStatusResponse } from '@aics/api-client';

export const appliedAdminRosterImportStatusFixture = {
  studentRoster: {
    appliedAt: '2026-09-22T09:47:00',
    fileName: 'OOP_김수용_학생_명단.xlsx',
  },
  teamRoster: {
    appliedAt: '2026-09-22T11:20:00',
    fileName: 'OOP_김수용_팀_명단.xlsx',
  },
} satisfies AdminRosterImportStatusResponse;
