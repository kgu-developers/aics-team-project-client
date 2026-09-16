import type { ReceivedPreferredPeerRequestListResponse } from '@aics/core';

import { apiClient } from '../client';
import { validatePreSurveySectionId } from './validatePreSurveySectionId';
import { ENDPOINTS } from '../constants/endpoints';

export async function rejectPreferredPeerRequest(
  sectionId: number,
  requesterUserId: string,
) {
  validatePreSurveySectionId(sectionId);
  const response =
    await apiClient.post<ReceivedPreferredPeerRequestListResponse>(
      ENDPOINTS.TEAM_ASSIGNMENT.REJECT_PREFERRED_PEER_REQUEST(
        String(sectionId),
        requesterUserId,
      ),
    );
  return response.data.contents;
}
