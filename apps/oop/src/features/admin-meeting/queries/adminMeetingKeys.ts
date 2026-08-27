export const adminMeetingKeys = {
  all: ['admin-meetings'] as const,
  detail: (meetingId: string, sectionId: string) =>
    [...adminMeetingKeys.all, 'detail', sectionId, meetingId] as const,
  list: (accessibleSectionIds: readonly string[]) =>
    [
      ...adminMeetingKeys.all,
      'list',
      [...accessibleSectionIds].sort(),
    ] as const,
};
