import type { Presentation } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchCurrentPresentation(): Promise<Presentation> {
  const response = await apiClient.get<Presentation>(
    ENDPOINTS.PRESENTATION.CURRENT,
  );
  return response.data;
}
