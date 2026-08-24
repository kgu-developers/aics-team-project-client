import { fetchAdminTeamDashboard } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { toAdminTeamDashboardView } from '../model';
import { adminTeamDashboardKeys } from './adminTeamDashboardKeys';

function shouldRetryTeamDashboardRequest(failureCount: number, error: unknown) {
  if (
    isAxiosError(error) &&
    error.response &&
    [401, 403, 404].includes(error.response.status)
  ) {
    return false;
  }

  return failureCount < 1;
}

export function useAdminTeamDashboardQuery(teamId: string) {
  return useQuery({
    enabled: Boolean(teamId),
    queryKey: adminTeamDashboardKeys.detail(teamId),
    queryFn: async () =>
      toAdminTeamDashboardView(await fetchAdminTeamDashboard(teamId)),
    retry: shouldRetryTeamDashboardRequest,
  });
}
