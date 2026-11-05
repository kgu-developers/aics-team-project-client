import type { TeamAssignmentProjection } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';
export async function fetchTeamAssignmentProjection(sectionId: string) {
  return (
    await apiClient.get<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.ROOT(sectionId),
    )
  ).data;
}
