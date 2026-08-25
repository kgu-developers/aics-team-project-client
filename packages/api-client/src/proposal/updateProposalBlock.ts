import type {
  Proposal,
  ProposalBlockKey,
  UpdateProposalBlockInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateProposalBlock(
  proposalId: string,
  blockKey: ProposalBlockKey,
  input: UpdateProposalBlockInput,
): Promise<Proposal> {
  const response = await apiClient.patch<Proposal>(
    ENDPOINTS.PROPOSAL.BLOCK(proposalId, blockKey),
    input,
  );
  return response.data;
}
