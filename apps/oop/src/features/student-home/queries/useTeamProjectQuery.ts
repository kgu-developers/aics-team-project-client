import { fetchTeamProject } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';

export function useTeamProjectQuery(teamId?: string) {
  return useQuery({
    queryKey: ['student-project', teamId],
    queryFn: isValidPositiveTeamId(teamId)
      ? () => fetchTeamProject(teamId)
      : skipToken,
  });
}
