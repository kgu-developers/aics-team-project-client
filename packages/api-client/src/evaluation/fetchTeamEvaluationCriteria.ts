import type { PresentationEvaluationCriterion } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamEvaluationCriteria(
  sectionId: string,
): Promise<PresentationEvaluationCriterion[]> {
  const response = await apiClient.get<PresentationEvaluationCriterion[]>(
    ENDPOINTS.EVALUATION.TEAM_CRITERIA(sectionId),
  );
  return response.data;
}
