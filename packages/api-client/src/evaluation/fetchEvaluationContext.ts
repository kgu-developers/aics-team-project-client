import type { EvaluationContext } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchEvaluationContext(
  sectionId: string,
): Promise<EvaluationContext> {
  const response = await apiClient.get<EvaluationContext>(
    ENDPOINTS.EVALUATION.CONTEXT(sectionId),
  );
  return response.data;
}
