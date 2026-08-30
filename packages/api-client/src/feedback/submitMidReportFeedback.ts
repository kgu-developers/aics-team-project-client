import type {
  MidReportFeedback,
  SubmitMidReportFeedbackInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMidReportFeedback(
  submissionId: string,
  input: SubmitMidReportFeedbackInput,
): Promise<MidReportFeedback> {
  const response = await apiClient.post<MidReportFeedback>(
    ENDPOINTS.SUBMISSION.MID_REPORT_FEEDBACK(submissionId),
    input,
  );

  return response.data;
}
