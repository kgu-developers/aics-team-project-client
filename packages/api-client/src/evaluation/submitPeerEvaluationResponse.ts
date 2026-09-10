import type { PeerEvaluationResponseDto } from '@aics/core';
import type {
  MyPeerEvaluationResponse,
  SubmitPeerEvaluationResponseInput,
} from '@aics/core';

import { mapPeerEvaluationResponse } from './peerEvaluationMapper';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitPeerEvaluationResponse(
  formId: string,
  input: SubmitPeerEvaluationResponseInput,
): Promise<MyPeerEvaluationResponse> {
  const response = await apiClient.post<PeerEvaluationResponseDto>(
    ENDPOINTS.EVALUATION.PEER_RESPONSES(formId),
    input,
  );
  return mapPeerEvaluationResponse(response.data);
}
