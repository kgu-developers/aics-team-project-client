export const studentHomeKeys = {
  all: ['student-home'] as const,
  user: (studentNumber: string | undefined, role: string | null) =>
    [...studentHomeKeys.all, 'user', studentNumber, role] as const,
  submission: (
    sectionId: string | undefined,
    teamId: string | undefined,
    milestoneId: number,
  ) =>
    [
      ...studentHomeKeys.all,
      'submission',
      sectionId,
      teamId,
      milestoneId,
    ] as const,
  dashboards: () => [...studentHomeKeys.all, 'dashboard'] as const,
  dashboard: (sectionId: string) =>
    [...studentHomeKeys.dashboards(), sectionId] as const,
};
