import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { fetchAdminTeamDashboardView } from '../api';
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
    queryFn: () => fetchAdminTeamDashboardView(teamId),
    retry: shouldRetryTeamDashboardRequest,
  });
}
