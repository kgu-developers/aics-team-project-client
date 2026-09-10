export const adminMilestoneSubmissionsKeys = {
  all: ['admin-milestone-submissions'] as const,
  list: (milestoneId: string, teamId?: string) =>
    [
      ...adminMilestoneSubmissionsKeys.all,
      'list',
      milestoneId,
      teamId ?? 'all-teams',
    ] as const,
  detail: (submissionId: string) =>
    [...adminMilestoneSubmissionsKeys.all, 'detail', submissionId] as const,
  version: (submissionId: string, version: number | undefined) =>
    [
      ...adminMilestoneSubmissionsKeys.all,
      'version',
      submissionId,
      version,
    ] as const,
  versions: (submissionId: string) =>
    [...adminMilestoneSubmissionsKeys.all, 'versions', submissionId] as const,
};
