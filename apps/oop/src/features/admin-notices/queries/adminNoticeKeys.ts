export const adminNoticeKeys = {
  all: ['admin-notices'] as const,
  list: (actorId: string | undefined, sectionId: number | undefined) =>
    [...adminNoticeKeys.all, actorId ?? null, sectionId ?? null] as const,
};
