import type {
  MyPeerEvaluationResponse,
  SubmitPeerEvaluationResponseInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitPeerEvaluationResponse(
  formId: string,
  input: SubmitPeerEvaluationResponseInput,
): Promise<MyPeerEvaluationResponse> {
  const response = await apiClient.post<MyPeerEvaluationResponse>(
    ENDPOINTS.EVALUATION.PEER_RESPONSES(formId),
    input,
  );
  return response.data;
}
