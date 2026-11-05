import { fetchTeamKickoff } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentContextMessages } from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';
import { teamKickoffQueryKey } from '~/features/team-assignment/queries/teamAssignmentKeys';

import { hasMeetingApiId } from './api/meetingApiKeys';

export function useMeetingTeamQuery() {
  const sessionRole = useAuthStore(state => state.sessionRole);
  const studentContext = useStudentContext();
  const identity = studentContext.identity.data;
  // Cache ownership follows the server identity. Request permission still requires
  // successful prerequisites; cached display data keeps an open edit draft mounted.
  const scopeTeamId =
    identity?.sections.length === 1 &&
    hasMeetingApiId(identity.teamId ?? undefined)
      ? identity.teamId!
      : undefined;
  const kickoff = useQuery({
    queryKey: teamKickoffQueryKey(scopeTeamId),
    queryFn: studentContext.teamId
      ? () => fetchTeamKickoff(studentContext.teamId!)
      : skipToken,
    retry: false,
  });
  const matchesTeam =
    kickoff.isSuccess && String(kickoff.data.id) === studentContext.teamId;
  const isPending =
    studentContext.status === 'loading' ||
    (studentContext.status === 'ready' && kickoff.isPending);
  const isError =
    studentContext.status === 'error' ||
    studentContext.status === 'ambiguous' ||
    (studentContext.status === 'ready' &&
      (kickoff.isError || (kickoff.isSuccess && !matchesTeam)));
  const teamId =
    matchesTeam && studentContext.status === 'ready'
      ? studentContext.teamId
      : undefined;
  const displayKickoff =
    scopeTeamId && kickoff.data && String(kickoff.data.id) === scopeTeamId
      ? kickoff.data
      : undefined;
  const team = displayKickoff
    ? {
        id: scopeTeamId!,
        name: displayKickoff.name,
        members: displayKickoff.members.map(member => ({
          id: member.studentNumber,
          name: member.name || member.studentNumber,
          isLeader: member.isLeader,
        })),
      }
    : undefined;
  return {
    studentContext,
    contextMessage:
      studentContext.status === 'ready'
        ? '팀 정보를 불러오지 못했어요. 다시 시도해 주세요.'
        : studentContextMessages[studentContext.status],
    requiresPhaseAndTime: true,
    canEditRecord: Boolean(team) && sessionRole === 'STUDENT',
    canManageActions: Boolean(teamId),
    canDeleteRecord: () => true,
    teamId,
    kickoff: displayKickoff,
    team,
    isPending,
    isError,
    canRetry: !studentContext.isFetching && !kickoff.isFetching,
    refetch: async () => {
      // Recover prerequisites first; enabled queries resume after context resolves.
      if (studentContext.status !== 'ready') return studentContext.retry();
      return kickoff.refetch();
    },
  };
}
