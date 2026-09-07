import { fetchTeamKickoff } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { teamKickoffQueryKey } from './teamAssignmentKeys';
import { isValidPositiveTeamId } from './useTeamMemberContactsQuery';

export function useTeamKickoffQuery(teamId?: string) {
  const validTeamId = isValidPositiveTeamId(teamId) ? teamId : undefined;

  return useQuery({
    queryKey: teamKickoffQueryKey(teamId),
    queryFn:
      validTeamId === undefined
        ? skipToken
        : () => fetchTeamKickoff(validTeamId),
    retry: false,
  });
}
