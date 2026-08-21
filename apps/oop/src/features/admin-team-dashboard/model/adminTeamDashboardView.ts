import type { AdminTeamDashboardResponse } from '@aics/api-client';
import type { AdminTeamDashboard } from '@aics/core';

import type { TeamMilestoneProgress } from './teamMilestoneProgress';

export type AdminTeamDashboardView = AdminTeamDashboard & {
  milestones: TeamMilestoneProgress[];
};

export function toAdminTeamDashboardView(
  response: AdminTeamDashboardResponse,
): AdminTeamDashboardView {
  return {
    ...response,
    milestones: response.milestones?.map(milestone => ({ ...milestone })) ?? [],
  };
}
