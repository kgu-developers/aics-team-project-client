import type { MeetingApiActionStatus, MeetingPhase } from '@aics/core';

export const meetingApiKeys = {
  all: ['meeting-api'] as const,
  list: (teamId: string | undefined) =>
    ['meeting-api', 'records', teamId] as const,
  filteredList: (teamId: string | undefined, phase?: MeetingPhase) =>
    [...meetingApiKeys.list(teamId), { phase }] as const,
  detail: (meetingId: string | undefined) =>
    ['meeting-api', 'record', meetingId] as const,
  recordActions: (meetingId: string | undefined) =>
    ['meeting-api', 'record-actions', meetingId] as const,
  teamActions: (teamId: string | undefined) =>
    ['meeting-api', 'team-actions', teamId] as const,
  filteredTeamActions: (
    teamId: string | undefined,
    status?: MeetingApiActionStatus,
  ) => [...meetingApiKeys.teamActions(teamId), { status }] as const,
};

export function hasMeetingApiId(id: string | undefined): id is string {
  return Boolean(
    id && /^[1-9]\d*$/.test(id) && BigInt(id) <= 9_223_372_036_854_775_807n,
  );
}
