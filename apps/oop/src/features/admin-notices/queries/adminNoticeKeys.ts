export const adminNoticeKeys = {
  all: ['admin-notices'] as const,
  list: (actorId: string | undefined, sectionId: number | undefined) =>
    [
      ...adminNoticeKeys.all,
      'list',
      actorId ?? null,
      sectionId ?? null,
    ] as const,
  detail: (
    actorId: string | undefined,
    sectionId: number | undefined,
    noticeId: number | undefined,
  ) =>
    [
      ...adminNoticeKeys.all,
      'detail',
      actorId ?? null,
      sectionId ?? null,
      noticeId ?? null,
    ] as const,
};
