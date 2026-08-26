import type {
  MyPresentationEvaluation,
  SubmitPresentationEvaluationInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitPresentationEvaluation(
  milestoneId: string,
  input: SubmitPresentationEvaluationInput,
): Promise<MyPresentationEvaluation> {
  const response = await apiClient.post<MyPresentationEvaluation>(
    ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(milestoneId),
    input,
  );
  return response.data;
}
