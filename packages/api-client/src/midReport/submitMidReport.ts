import type { MidReport, SubmitDocumentSessionInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMidReport(
  midReportId: string,
  input: SubmitDocumentSessionInput,
): Promise<MidReport> {
  const response = await apiClient.post<MidReport>(
    ENDPOINTS.MID_REPORT.SUBMIT(midReportId),
    input,
  );
  return response.data;
}
