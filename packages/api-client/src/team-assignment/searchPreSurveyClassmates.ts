import type { PreSurveyClassmateListResponse } from '@aics/core';

import { apiClient } from '../client';
import { validatePreSurveySectionId } from './validatePreSurveySectionId';
import { ENDPOINTS } from '../constants/endpoints';

export async function searchPreSurveyClassmates(
  sectionId: number,
  keyword: string,
) {
  validatePreSurveySectionId(sectionId);
  const response = await apiClient.get<PreSurveyClassmateListResponse>(
    ENDPOINTS.TEAM_ASSIGNMENT.PRE_SURVEY_CLASSMATES(String(sectionId)),
    { params: { keyword: keyword.trim() } },
  );
  return response.data.contents;
}
