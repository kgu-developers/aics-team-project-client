import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { useAuthStore } from '~/features/auth/authStore';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

import { hasMeetingApiId } from './api/meetingApiKeys';

export function useMeetingTeamQuery() {
  const user = useAuthStore(state => state.currentUser);
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const teamId = isDemo ? user?.currentTeam?.id : (user?.teamId ?? undefined);
  const kickoff = useTeamKickoffQuery(isDemo ? undefined : teamId);
  const valid = isDemo ? Boolean(teamId) : hasMeetingApiId(teamId);
  return {
    isDemo,
    requiresPhaseAndTime: !isDemo,
    canEditRecord: isDemo,
    canManageActions: isDemo,
    canDeleteRecord: (authorId: string) =>
      !isDemo ||
      authorId === user?.id ||
      Boolean(
        user?.currentTeam?.members.find(member => member.id === user.id)
          ?.isLeader,
      ),
    teamId,
    kickoff: kickoff.data,
    team: isDemo
      ? user?.currentTeam
      : kickoff.data && valid
        ? {
            id: teamId!,
            name: kickoff.data.name,
            members: kickoff.data.members.map(member => ({
              id: member.studentNumber,
              name: member.name || member.studentNumber,
              isLeader: member.isLeader,
            })),
          }
        : undefined,
    isPending: !isDemo && valid && kickoff.isPending,
    isError: !isDemo && Boolean(teamId) && (!valid || kickoff.isError),
    canRetry: valid && !kickoff.isFetching,
    refetch: kickoff.refetch,
  };
}
