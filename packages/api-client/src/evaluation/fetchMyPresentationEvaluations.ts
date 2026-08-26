import type { PresentationEvaluationOverview } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMyPresentationEvaluations(
  milestoneId: string,
): Promise<PresentationEvaluationOverview> {
  const response = await apiClient.get<PresentationEvaluationOverview>(
    ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(milestoneId),
  );
  return response.data;
}
