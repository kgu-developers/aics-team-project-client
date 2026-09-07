export const adminMilestoneSubmissionsKeys = {
  all: ['admin-milestone-submissions'] as const,
  list: (milestoneId: string) =>
    [...adminMilestoneSubmissionsKeys.all, 'list', milestoneId] as const,
  detail: (submissionId: string) =>
    [...adminMilestoneSubmissionsKeys.all, 'detail', submissionId] as const,
};
