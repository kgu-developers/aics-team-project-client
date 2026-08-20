import { ENDPOINTS, apiClient } from '@aics/api-client';
import type { AdminTeamDashboard } from '@aics/core';

import type { TeamMilestoneProgress } from '../model';

export type AdminTeamDashboardView = AdminTeamDashboard & {
  milestones: TeamMilestoneProgress[];
};

type AdminTeamDashboardViewResponse = AdminTeamDashboard & {
  milestones?: TeamMilestoneProgress[];
};

export async function fetchAdminTeamDashboardView(
  teamId: string,
): Promise<AdminTeamDashboardView> {
  const response = await apiClient.get<AdminTeamDashboardViewResponse>(
    ENDPOINTS.ADMIN.TEAM_DASHBOARD(teamId),
  );

  return {
    ...response.data,
    milestones: response.data.milestones ?? [],
  };
}
