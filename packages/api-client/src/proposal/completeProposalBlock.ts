import type {
  CompleteProposalBlockInput,
  Proposal,
  ProposalBlockKey,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function completeProposalBlock(
  proposalId: string,
  blockKey: ProposalBlockKey,
  input: CompleteProposalBlockInput,
): Promise<Proposal> {
  const response = await apiClient.post<Proposal>(
    ENDPOINTS.PROPOSAL.BLOCK_COMPLETION(proposalId, blockKey),
    input,
  );
  return response.data;
}
