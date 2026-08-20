import type { TeamAssignmentProjection } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function respondToPartnerRequest(
  sectionId: string,
  requestId: string,
  decision: 'approve' | 'reject',
) {
  return (
    await apiClient.post<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_REQUEST_RESPONSE(sectionId, requestId),
      { decision },
    )
  ).data;
}
