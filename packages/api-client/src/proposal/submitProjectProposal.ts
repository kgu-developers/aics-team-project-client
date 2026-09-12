import { apiClient } from '../client';
import { assertProposalId } from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function submitProjectProposal(projectId: number): Promise<void> {
  assertProposalId(projectId);
  await apiClient.patch(ENDPOINTS.PROJECT_PROPOSAL.COMPLETE(projectId));
}
