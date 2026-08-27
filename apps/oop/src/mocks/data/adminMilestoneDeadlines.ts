export type AdminMilestoneId =
  | 'proposal'
  | 'midterm'
  | 'presentation-submit'
  | 'presentation-evaluate'
  | 'final-report'
  | 'peer-review';

export const adminMilestoneDeadlineFixtures: Record<AdminMilestoneId, string> =
  {
    proposal: '2026-08-24',
    midterm: '2026-10-15',
    'presentation-submit': '2026-11-12',
    'presentation-evaluate': '2026-11-26',
    'final-report': '2026-12-07',
    'peer-review': '2026-08-30',
  };

export function getAdminMilestoneDeadlineLabel(milestoneId: AdminMilestoneId) {
  return adminMilestoneDeadlineFixtures[milestoneId]!;
}

export function getAdminMilestoneSummary(
  milestoneId: AdminMilestoneId,
  label: string,
) {
  return `~${getAdminMilestoneDeadlineLabel(milestoneId).slice(5).replaceAll('-', '/')}\n${label}`;
}
