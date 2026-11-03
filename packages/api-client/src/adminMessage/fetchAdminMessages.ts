import type { AdminMessagePage, TeamMessagesParams } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMessageSortDirection = 'ASC' | 'DESC';

export type AdminMessagesParams = TeamMessagesParams & {
  sectionId?: string | number;
  senderKeyword?: string;
  sort?: AdminMessageSortDirection;
  teamId?: string | number;
};

export async function fetchAdminMessages(
  params: AdminMessagesParams = {},
  options?: { signal?: AbortSignal },
) {
  const response = await apiClient.get<AdminMessagePage>(
    ENDPOINTS.ADMIN_MESSAGE.LIST,
    { params, signal: options?.signal },
  );
  return response.data;
}
