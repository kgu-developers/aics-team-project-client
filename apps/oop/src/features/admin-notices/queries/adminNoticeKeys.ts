export const adminNoticeKeys = {
  all: ['admin-notices'] as const,
  detail: (noticeId: string) =>
    [...adminNoticeKeys.all, 'detail', noticeId] as const,
  list: () => [...adminNoticeKeys.all, 'list'] as const,
};
