export const meetingKeys = {
  all: ['meeting-records'] as const,
  list: (teamId: string) => [...meetingKeys.all, 'list', teamId] as const,
  actions: (teamId: string) => [...meetingKeys.all, 'actions', teamId] as const,
  detail: (meetingId: string) =>
    [...meetingKeys.all, 'detail', meetingId] as const,
};
