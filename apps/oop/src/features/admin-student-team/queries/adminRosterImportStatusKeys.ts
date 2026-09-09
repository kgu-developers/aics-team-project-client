export const adminRosterImportStatusKeys = {
  all: ['admin-roster-import-status'] as const,
  bySection: (sectionId: string) =>
    [...adminRosterImportStatusKeys.all, sectionId] as const,
};
