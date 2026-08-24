import type { Proposal, SubmitProposalInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitProposal(
  proposalId: string,
  input: SubmitProposalInput,
): Promise<Proposal> {
  const response = await apiClient.post<Proposal>(
    ENDPOINTS.PROPOSAL.SUBMIT(proposalId),
    input,
  );
  return response.data;
}
