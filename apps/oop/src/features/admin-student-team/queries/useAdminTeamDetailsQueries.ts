import { fetchAdminTeam } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useAdminTeamDetailsQueries(teamIds: number[]) {
  return useQueries({
    queries: teamIds.map(teamId => ({
      queryKey: adminStudentTeamKeys.team(teamId),
      queryFn: () => fetchAdminTeam(teamId),
    })),
  });
}
