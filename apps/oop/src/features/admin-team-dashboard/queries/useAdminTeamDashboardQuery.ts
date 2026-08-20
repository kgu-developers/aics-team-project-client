import { useQuery } from '@tanstack/react-query';

import { fetchAdminTeamDashboardView } from '../api';
import { adminTeamDashboardKeys } from './adminTeamDashboardKeys';

export function useAdminTeamDashboardQuery(teamId: string) {
  return useQuery({
    enabled: Boolean(teamId),
    queryKey: adminTeamDashboardKeys.detail(teamId),
    queryFn: () => fetchAdminTeamDashboardView(teamId),
  });
}
