import type {
  ConfirmTeamLeaderInput,
  TeamAssignmentProjection,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';
export async function confirmTeamLeader(input: ConfirmTeamLeaderInput) {
  return (
    await apiClient.post<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.LEADER(input.sectionId, input.teamId),
    )
  ).data;
}
