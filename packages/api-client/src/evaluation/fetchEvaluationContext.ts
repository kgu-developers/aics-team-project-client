import type { EvaluationContext, EvaluationContextResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchEvaluationContext(
  sectionId: string,
): Promise<EvaluationContext> {
  const response = await apiClient.get<EvaluationContextResponse>(
    ENDPOINTS.EVALUATION.CONTEXT(sectionId),
  );
  return {
    presentationMilestoneId: response.data.presentationMilestoneId ?? undefined,
    peerEvaluationFormId: response.data.peerEvaluationFormId ?? undefined,
  };
}
