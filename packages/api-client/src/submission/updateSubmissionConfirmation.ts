import type { Submission } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function confirmSubmission(
  submissionId: string,
): Promise<Submission> {
  const response = await apiClient.put<Submission>(
    ENDPOINTS.SUBMISSION.CONFIRMATION(submissionId),
  );

  return response.data;
}

export async function withdrawSubmissionConfirmation(
  submissionId: string,
): Promise<Submission> {
  const response = await apiClient.delete<Submission>(
    ENDPOINTS.SUBMISSION.CONFIRMATION(submissionId),
  );

  return response.data;
}
