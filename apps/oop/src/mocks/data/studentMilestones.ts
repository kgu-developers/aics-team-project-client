import type { StudentMilestoneResponse } from '@aics/core';

/** Synthetic IDs and schedules for the student-list contract. */
export function studentMilestoneFixtures(
  sectionId: number,
): StudentMilestoneResponse[] {
  return [
    { id: 301, title: '제안서', type: 'PROPOSAL' as const, weekNumber: 3 },
    {
      id: 302,
      title: '중간보고서',
      type: 'MID_REPORT' as const,
      weekNumber: 8,
    },
    { id: 303, title: '발표', type: 'PRESENTATION' as const, weekNumber: 14 },
    {
      id: 304,
      title: '최종보고서',
      type: 'FINAL_REPORT' as const,
      weekNumber: 15,
    },
    {
      id: 305,
      title: '상호 평가',
      type: 'PEER_EVALUATION' as const,
      weekNumber: 15,
    },
  ].map(item => ({
    ...item,
    id: sectionId * 1000 + item.id,
    sectionId,
    status: 'PUBLISHED',
    allowResubmissionBeforeDueAt: true,
    schedule: { opensAt: '2026-09-01T09:00:00', dueAt: '2026-12-15T23:59:00' },
  }));
}
