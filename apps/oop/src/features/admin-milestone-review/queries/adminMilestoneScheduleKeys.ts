export const adminMilestoneScheduleKeys = {
  all: ['admin-milestone-schedule'] as const,
  list: (sectionIds: readonly string[]) =>
    [...adminMilestoneScheduleKeys.all, [...sectionIds].sort()] as const,
};
