import type { AdminTeamDashboard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminTeamDashboardMilestoneStatusDto =
  | { kind: 'before-deadline' }
  | { kind: 'not-submitted' }
  | { kind: 'submitted'; submittedDateLabel: string }
  | { kind: 'evaluated' };

export type AdminTeamDashboardMilestoneDto = {
  id: string;
  title: string;
  deadlineLabel: string;
  submissionId: string | null;
  status: AdminTeamDashboardMilestoneStatusDto;
};

export type AdminTeamDashboardResponse = AdminTeamDashboard & {
  milestones?: AdminTeamDashboardMilestoneDto[];
};

export async function fetchAdminTeamDashboard(
  teamId: string,
): Promise<AdminTeamDashboardResponse> {
  const response = await apiClient.get<AdminTeamDashboardResponse>(
    ENDPOINTS.ADMIN.TEAM_DASHBOARD(teamId),
  );

  return response.data;
}
