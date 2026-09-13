export const adminMidReportKeys = {
  all: ['admin-mid-report'] as const,
  detail: (sectionId: string, teamId: string) =>
    [...adminMidReportKeys.all, 'detail', sectionId, teamId] as const,
  feedbacks: (sectionId: string, teamId: string, page: number) =>
    [...adminMidReportKeys.all, 'feedbacks', sectionId, teamId, page] as const,
};
