export const adminNoticeKeys = {
  all: ['admin-notices'] as const,
  detail: (sectionId: string | undefined, noticeId: string) =>
    [...adminNoticeKeys.all, 'detail', sectionId ?? null, noticeId] as const,
  list: (sectionId: string | undefined) =>
    [...adminNoticeKeys.all, 'list', sectionId ?? null] as const,
};
