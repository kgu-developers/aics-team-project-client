import type {
  AdminTeamDashboardMilestoneDto,
  AdminTeamDashboardResponse,
} from '@aics/api-client';
import type { AdminTeamDashboard } from '@aics/core';

import type { TeamMilestoneProgress } from './teamMilestoneProgress';

export type AdminTeamDashboardView = AdminTeamDashboard & {
  milestones: TeamMilestoneProgress[];
};

function toTeamMilestoneProgress(
  milestone: AdminTeamDashboardMilestoneDto,
): TeamMilestoneProgress {
  return {
    deadlineLabel: milestone.deadlineLabel,
    downloadFiles: milestone.downloadFiles?.map(file => ({ ...file })),
    id: milestone.id,
    summary: milestone.summary ? { ...milestone.summary } : undefined,
    status: milestone.status,
    submittedMemberCount: milestone.submittedMemberCount,
    memberCount: milestone.memberCount,
    submissionId: milestone.submissionId,
    title: milestone.title,
  };
}

export function toAdminTeamDashboardView(
  response: AdminTeamDashboardResponse,
): AdminTeamDashboardView {
  return {
    ...response,
    milestones: response.milestones?.map(toTeamMilestoneProgress) ?? [],
  };
}
