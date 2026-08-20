import type {
  SaveTeamAssignmentSurveyInput,
  TeamAssignmentProjection,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function saveTeamAssignmentSurvey(
  input: SaveTeamAssignmentSurveyInput,
) {
  return (
    await apiClient.put<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.SURVEY(input.sectionId),
      input.survey,
    )
  ).data;
}
