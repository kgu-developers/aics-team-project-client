import type { ReceivedPreferredPeerRequestListResponse } from '@aics/core';

import { apiClient } from '../client';
import { validatePreSurveySectionId } from './validatePreSurveySectionId';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchReceivedPreferredPeerRequests(sectionId: number) {
  validatePreSurveySectionId(sectionId);
  const response =
    await apiClient.get<ReceivedPreferredPeerRequestListResponse>(
      ENDPOINTS.TEAM_ASSIGNMENT.RECEIVED_PREFERRED_PEER_REQUESTS(
        String(sectionId),
      ),
    );
  return response.data.contents;
}
