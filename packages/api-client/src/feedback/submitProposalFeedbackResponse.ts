import type {
  ProposalFeedbackResponse,
  SubmitProposalFeedbackResponseInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitProposalFeedbackResponse(
  reviewId: string,
  input: SubmitProposalFeedbackResponseInput,
): Promise<ProposalFeedbackResponse> {
  const response = await apiClient.post<ProposalFeedbackResponse>(
    ENDPOINTS.REVIEW.REVISION_RESPONSE(reviewId),
    input,
  );

  return response.data;
}
