import type {
  PreSurveyResponseDetailResponse,
  SubmitPreSurveyResponseRequest,
  SubmitTeamAssignmentSurveyInput,
} from '@aics/core';

import { validatePreSurveyResponse } from './validatePreSurveyResponse';
import { validatePreSurveySectionId } from './validatePreSurveySectionId';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTeamAssignmentSurvey(
  input: SubmitTeamAssignmentSurveyInput,
): Promise<PreSurveyResponseDetailResponse> {
  validatePreSurveySectionId(input.sectionId);
  const request: SubmitPreSurveyResponseRequest = {
    preferredRoles: input.survey.rolePreferences,
    topicOpinion: input.survey.topicIdea,
    etcOpinion: input.survey.note,
  };

  const response = await apiClient.post<PreSurveyResponseDetailResponse>(
    ENDPOINTS.TEAM_ASSIGNMENT.SUBMIT_SURVEY_RESPONSE(String(input.sectionId)),
    request,
  );

  return validatePreSurveyResponse(response.data);
}
