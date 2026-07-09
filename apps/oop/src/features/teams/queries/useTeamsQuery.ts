import { fetchTeams } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { teamKeys } from './teamKeys';

export function useTeamsQuery(sectionId: string) {
  return useQuery({
    queryKey: teamKeys.list(sectionId),
    queryFn: () => fetchTeams(sectionId),
  });
}
