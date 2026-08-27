export const studentNoticeKeys = {
  all: ['student-notices'] as const,
  sectionAnnouncements: (sectionId: string) =>
    [...studentNoticeKeys.all, 'announcements', sectionId] as const,
};
