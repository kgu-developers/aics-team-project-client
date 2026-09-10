import type { PeerEvaluationTargetsResponse } from '@aics/core';
import type { PeerEvaluationTargets } from '@aics/core';

import { mapPeerEvaluationTargets } from './peerEvaluationMapper';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchPeerEvaluationTargets(
  formId: string,
): Promise<PeerEvaluationTargets> {
  const response = await apiClient.get<PeerEvaluationTargetsResponse>(
    ENDPOINTS.EVALUATION.PEER_TARGETS(formId),
  );
  return mapPeerEvaluationTargets(response.data);
}
