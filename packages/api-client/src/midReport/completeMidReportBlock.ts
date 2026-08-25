import type {
  CompleteDocumentBlockInput,
  MidReport,
  MidReportBlockKey,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function completeMidReportBlock(
  midReportId: string,
  blockKey: MidReportBlockKey,
  input: CompleteDocumentBlockInput,
): Promise<MidReport> {
  const response = await apiClient.post<MidReport>(
    ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(midReportId, blockKey),
    input,
  );
  return response.data;
}
