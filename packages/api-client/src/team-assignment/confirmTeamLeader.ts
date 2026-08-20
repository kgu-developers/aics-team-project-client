import type {
  ConfirmTeamLeaderInput,
  TeamAssignmentPhase,
  TeamAssignmentProjection,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function confirmTeamLeader(
  input: ConfirmTeamLeaderInput,
  developmentPreview?: TeamAssignmentPhase,
) {
  return (
    await apiClient.post<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.LEADER(input.sectionId, input.teamId),
      undefined,
      developmentPreview
        ? { headers: { 'X-OOP-Team-Assignment-Preview': developmentPreview } }
        : undefined,
    )
  ).data;
}
