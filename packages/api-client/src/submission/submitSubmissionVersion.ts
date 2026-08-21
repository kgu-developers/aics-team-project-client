import type { Submission, SubmitSubmissionVersionInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitSubmissionVersion(
  submissionId: string,
  input: SubmitSubmissionVersionInput,
): Promise<Submission> {
  const response = await apiClient.post<Submission>(
    ENDPOINTS.SUBMISSION.VERSIONS(submissionId),
    input,
  );

  return response.data;
}
