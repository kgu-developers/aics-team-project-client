export const midReportKeys = {
  all: ['mid-reports'] as const,
  current: () => [...midReportKeys.all, 'current'] as const,
};
