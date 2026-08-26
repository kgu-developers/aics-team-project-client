export const adminMilestoneSubmissionsKeys = {
  all: ['admin-milestone-submissions'] as const,
  list: (sectionId: string, milestoneId: string) =>
    [...adminMilestoneSubmissionsKeys.all, sectionId, milestoneId] as const,
  detail: (submissionId: string) =>
    [...adminMilestoneSubmissionsKeys.all, 'detail', submissionId] as const,
};
