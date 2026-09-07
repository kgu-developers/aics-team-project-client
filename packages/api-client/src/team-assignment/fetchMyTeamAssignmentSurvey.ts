import type { PreSurveyResponseDetailResponse } from '@aics/core';

import { validatePreSurveyResponse } from './validatePreSurveyResponse';
import { validatePreSurveySectionId } from './validatePreSurveySectionId';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMyTeamAssignmentSurvey(
  sectionId: number,
): Promise<PreSurveyResponseDetailResponse> {
  validatePreSurveySectionId(sectionId);
  const response = await apiClient.get<PreSurveyResponseDetailResponse>(
    ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE,
    { params: { sectionId } },
  );

  return validatePreSurveyResponse(response.data);
}
