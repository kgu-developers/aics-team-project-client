export const studentNoticeKeys = {
  all: ['student-notices'] as const,
  sectionAnnouncements: (sectionId: number | undefined) =>
    [...studentNoticeKeys.all, 'announcements', sectionId ?? null] as const,
};
