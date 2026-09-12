import type {
  CompleteDocumentBlockInput,
  MidReport,
  MidReportBlockKey,
} from '@aics/core';

import { mapMidReport } from './mapMidReport';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function completeMidReportBlock(
  midReportId: string,
  blockKey: MidReportBlockKey,
  input: CompleteDocumentBlockInput,
): Promise<MidReport> {
  const response = await apiClient.post<unknown>(
    ENDPOINTS.MID_REPORT.BLOCK_COMPLETION(midReportId, blockKey),
    input,
  );
  return mapMidReport(response.data);
}
