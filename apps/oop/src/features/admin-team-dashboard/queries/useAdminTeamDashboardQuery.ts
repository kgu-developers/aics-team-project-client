import { fetchAdminTeamDashboard } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminTeamDashboardKeys } from './adminTeamDashboardKeys';

export function useAdminTeamDashboardQuery(teamId: string) {
  return useQuery({
    enabled: Boolean(teamId),
    queryKey: adminTeamDashboardKeys.detail(teamId),
    queryFn: () => fetchAdminTeamDashboard(teamId),
  });
}
