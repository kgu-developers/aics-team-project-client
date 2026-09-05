import type {
  FetchMySectionsFilter,
  MySectionsResponse,
  SectionResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMySections(
  filter: FetchMySectionsFilter = {},
): Promise<SectionResponse[]> {
  const response = await apiClient.get<MySectionsResponse>(
    ENDPOINTS.SECTION.MY_SECTIONS,
    { params: filter },
  );

  return response.data.contents;
}
