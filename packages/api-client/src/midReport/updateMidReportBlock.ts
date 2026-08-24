import type {
  MidReport,
  MidReportBlockKey,
  UpdateMidReportBlockInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateMidReportBlock(
  midReportId: string,
  blockKey: MidReportBlockKey,
  input: UpdateMidReportBlockInput,
): Promise<MidReport> {
  const response = await apiClient.patch<MidReport>(
    ENDPOINTS.MID_REPORT.BLOCK(midReportId, blockKey),
    input,
  );
  return response.data;
}
