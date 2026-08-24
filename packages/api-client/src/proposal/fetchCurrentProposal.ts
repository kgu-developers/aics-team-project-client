import type { Proposal } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchCurrentProposal(): Promise<Proposal> {
  const response = await apiClient.get<Proposal>(ENDPOINTS.PROPOSAL.CURRENT);
  return response.data;
}
