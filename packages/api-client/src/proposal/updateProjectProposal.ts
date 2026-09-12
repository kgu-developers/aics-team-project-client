import type { UpdateProjectProposalInput } from '@aics/core';

import { apiClient } from '../client';
import {
  assertProposalId,
  parseProjectProposal,
} from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function updateProjectProposal(
  teamId: string,
  input: UpdateProjectProposalInput,
) {
  assertProposalId(teamId);
  const body = {
    ...input,
    screenConfiguration: input.screenConfiguration.map(screen => {
      const stored = { ...screen };
      delete stored.imageUrl;
      return stored;
    }),
  };
  const response = await apiClient.put<unknown>(
    ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM(teamId),
    body,
  );
  return parseProjectProposal(response.data, teamId);
}
