import type { TeamAssignmentPhase, TeamAssignmentProjection } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamAssignmentProjection(
  sectionId: string,
  developmentPreview?: TeamAssignmentPhase,
) {
  return (
    await apiClient.get<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.ROOT(sectionId),
      developmentPreview
        ? { headers: { 'X-OOP-Team-Assignment-Preview': developmentPreview } }
        : undefined,
    )
  ).data;
}
