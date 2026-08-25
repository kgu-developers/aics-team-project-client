import type { MidReport } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchCurrentMidReport(): Promise<MidReport> {
  const response = await apiClient.get<MidReport>(ENDPOINTS.MID_REPORT.CURRENT);
  return response.data;
}
