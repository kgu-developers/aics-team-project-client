import { apiClient } from '../client';
import {
  assertProposalId,
  parseProposalSections,
} from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function fetchProposalSections(projectId: number) {
  assertProposalId(projectId);
  const response = await apiClient.get<unknown>(
    ENDPOINTS.PROJECT_PROPOSAL.SECTIONS(projectId),
  );
  return parseProposalSections(response.data);
}
