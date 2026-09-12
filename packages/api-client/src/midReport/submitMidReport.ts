import type { MidReport, SubmitDocumentSessionInput } from '@aics/core';

import { mapMidReport } from './mapMidReport';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMidReport(
  midReportId: string,
  input: SubmitDocumentSessionInput,
): Promise<MidReport> {
  const response = await apiClient.post<unknown>(
    ENDPOINTS.MID_REPORT.SUBMIT(midReportId),
    input,
  );
  return mapMidReport(response.data);
}
