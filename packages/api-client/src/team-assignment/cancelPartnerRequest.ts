import type { TeamAssignmentProjection } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function cancelPartnerRequest(
  sectionId: string,
  requestId: string,
) {
  return (
    await apiClient.delete<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_REQUEST(sectionId, requestId),
    )
  ).data;
}
