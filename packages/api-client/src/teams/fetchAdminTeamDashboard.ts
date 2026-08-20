import type { AdminTeamDashboard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminTeamDashboard(
  teamId: string,
): Promise<AdminTeamDashboard> {
  const response = await apiClient.get<AdminTeamDashboard>(
    ENDPOINTS.ADMIN.TEAM_DASHBOARD(teamId),
  );

  return response.data;
}
