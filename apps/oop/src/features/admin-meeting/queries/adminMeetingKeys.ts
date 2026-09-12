export const adminMeetingKeys = {
  all: ['admin-meetings'] as const,
  detail: (meetingId: string, sectionId: string) =>
    [...adminMeetingKeys.all, 'detail', sectionId, meetingId] as const,
  serverDetail: (meetingId: string) =>
    [...adminMeetingKeys.all, 'server-detail', meetingId] as const,
  list: (
    accessibleSectionIds: readonly string[],
    filter?: { sectionId?: string; teamId?: string; milestoneId?: string },
  ) =>
    [
      ...adminMeetingKeys.all,
      'list',
      [...accessibleSectionIds].sort(),
      filter?.sectionId ?? null,
      filter?.teamId ?? null,
      filter?.milestoneId ?? null,
    ] as const,
  serverList: (
    accessibleSectionIds: readonly string[],
    filter?: {
      page?: number;
      sectionId?: number | string;
      size?: number;
      teamId?: number | string;
      milestoneId?: number | string;
    },
  ) =>
    [
      ...adminMeetingKeys.all,
      'server-list',
      [...accessibleSectionIds].sort(),
      filter?.sectionId ?? null,
      filter?.teamId ?? null,
      filter?.milestoneId ?? null,
      filter?.page ?? 0,
      filter?.size ?? 20,
    ] as const,
};
