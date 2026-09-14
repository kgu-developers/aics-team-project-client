import { fetchProjectProposal } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';

export function useAdminProjectProposalQuery(
  sectionId: string,
  teamId?: string,
) {
  const user = useAuthStore(state => state.currentUser);
  const canRead = Boolean(
    user &&
    user.globalRole !== 'STUDENT' &&
    user.sections.some(section => section.id === sectionId),
  );
  return useQuery({
    queryKey: ['admin-project-proposal', user?.id, sectionId, teamId],
    enabled: canRead && isValidPositiveTeamId(teamId),
    retry: false,
    queryFn: () => {
      if (!canRead || !isValidPositiveTeamId(teamId))
        throw new Error('담당 분반과 팀을 확인해 주세요.');
      return fetchProjectProposal(teamId);
    },
  });
}
