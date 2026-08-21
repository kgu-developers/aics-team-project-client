import type { Submission } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchSubmission(
  submissionId: string,
): Promise<Submission> {
  const response = await apiClient.get<Submission>(
    ENDPOINTS.SUBMISSION.DETAIL(submissionId),
  );

  return response.data;
}
