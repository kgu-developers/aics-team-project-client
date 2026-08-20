import type {
  SaveTeamAssignmentSurveyInput,
  TeamAssignmentProjection,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTeamAssignmentSurvey(
  input: SaveTeamAssignmentSurveyInput,
) {
  return (
    await apiClient.post<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.SURVEY(input.sectionId),
      input.survey,
    )
  ).data;
}
