export const studentHomeKeys = {
  all: ['student-home'] as const,
  dashboards: () => [...studentHomeKeys.all, 'dashboard'] as const,
  dashboard: (sectionId: string) =>
    [...studentHomeKeys.dashboards(), sectionId] as const,
};
