import type { AdminTeamDashboard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminTeamDashboardMilestoneStatusDto =
  | { kind: 'before-deadline' }
  | { kind: 'not-submitted' }
  | { kind: 'submitted'; submittedDateLabel: string }
  | { kind: 'evaluated' };

export type AdminTeamDashboardMilestoneDownloadFileDto = {
  downloadUrl: string;
  fileName: string;
  label: string;
};

export type AdminTeamDashboardMilestoneSummaryDto = {
  attachmentCount?: number | null;
  presentationFileDownloadUrl?: string | null;
  presentationFileName?: string | null;
  sourceArchiveDownloadUrl?: string | null;
  sourceArchiveFileName?: string | null;
  videoUrl?: string | null;
};

export type AdminTeamDashboardMilestoneDto = {
  id: string;
  title: string;
  deadlineLabel: string;
  downloadFiles?: AdminTeamDashboardMilestoneDownloadFileDto[];
  summary?: AdminTeamDashboardMilestoneSummaryDto;
  submissionId: string | null;
  status: AdminTeamDashboardMilestoneStatusDto;
  submittedMemberCount?: number | null;
  memberCount?: number | null;
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
