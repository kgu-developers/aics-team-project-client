import type { TeamAssignmentProjection } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function requestPartner(sectionId: string, candidateId: string) {
  return (
    await apiClient.post<TeamAssignmentProjection>(
      ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_REQUESTS(sectionId),
      { candidateId },
    )
  ).data;
}
