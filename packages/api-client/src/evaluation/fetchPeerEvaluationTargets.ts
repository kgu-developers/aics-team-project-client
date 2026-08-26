import type { PeerEvaluationTargets } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchPeerEvaluationTargets(
  formId: string,
): Promise<PeerEvaluationTargets> {
  const response = await apiClient.get<PeerEvaluationTargets>(
    ENDPOINTS.EVALUATION.PEER_TARGETS(formId),
  );
  return response.data;
}
