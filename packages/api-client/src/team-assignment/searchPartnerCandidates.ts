import type { PartnerCandidate } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function searchPartnerCandidates(
  sectionId: string,
  query: string,
) {
  return (
    await apiClient.get<PartnerCandidate[]>(
      ENDPOINTS.TEAM_ASSIGNMENT.PARTNER_CANDIDATES(sectionId),
      { params: { query } },
    )
  ).data;
}
