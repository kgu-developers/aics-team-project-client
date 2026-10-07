import { fetchTeamKickoff } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';

export function useAdminPresentationTeamMembersQuery(
  teamId: number | undefined,
  enabled = true,
) {
  const validTeamId =
    teamId !== undefined && Number.isSafeInteger(teamId) && teamId > 0
      ? String(teamId)
      : undefined;

  return useQuery({
    queryKey: adminPresentationProgressKeys.teamMembers(validTeamId ?? ''),
    queryFn:
      validTeamId && enabled ? () => fetchTeamKickoff(validTeamId) : skipToken,
    retry: false,
  });
}
