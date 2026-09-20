import { useStudentHomeUserQuery } from '~/features/student-home/queries/useStudentHomeUserQuery';

export const TEAM_ASSIGNMENT_WAITING_POLL_INTERVAL_MS = 5_000;

export function useTeamAssignmentWaitingPoll(enabled: boolean) {
  return useStudentHomeUserQuery(enabled, {
    refetchInterval: enabled ? TEAM_ASSIGNMENT_WAITING_POLL_INTERVAL_MS : false,
  });
}
