import { fetchTeamMemberContacts } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { teamMemberContactsQueryKey } from './teamAssignmentKeys';

export function isValidPositiveTeamId(teamId?: string): teamId is string {
  if (!teamId || !/^[1-9]\d*$/.test(teamId)) return false;

  // The server sends numeric IDs; only accept values JavaScript can represent exactly.
  return Number.isSafeInteger(Number(teamId));
}

export function useTeamMemberContactsQuery(teamId?: string, enabled = true) {
  const validTeamId =
    enabled && isValidPositiveTeamId(teamId) ? teamId : undefined;

  return useQuery({
    queryKey: teamMemberContactsQueryKey(validTeamId),
    queryFn:
      validTeamId === undefined
        ? skipToken
        : () => fetchTeamMemberContacts(validTeamId),
    // Contact details are intentionally scoped to the first-meeting screen.
    // Drop them as soon as the final observer leaves instead of retaining
    // sensitive values in the shared query cache.
    gcTime: 0,
    retry: false,
  });
}
