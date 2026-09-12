import type { MyTeamEvaluationsResponse } from '@aics/core';

import { apiClient } from '../client';
import { parseMyTeamEvaluations } from './teamEvaluationContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMyTeamEvaluations(
  milestoneId: string,
): Promise<MyTeamEvaluationsResponse> {
  const response = await apiClient.get<unknown>(
    ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(milestoneId),
  );
  return parseMyTeamEvaluations(response.data);
}
