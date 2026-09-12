import type { MidReport } from '@aics/core';

import { mapMidReport } from './mapMidReport';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchCurrentMidReport(): Promise<MidReport> {
  const response = await apiClient.get<unknown>(ENDPOINTS.MID_REPORT.CURRENT);
  return mapMidReport(response.data);
}
