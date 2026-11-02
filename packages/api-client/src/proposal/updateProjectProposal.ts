import type { SaveProposalSectionInput } from '@aics/core';

import { apiClient } from '../client';
import {
  assertProposalId,
  parseProjectProposal,
} from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function updateProjectProposal(
  teamId: string,
  input: SaveProposalSectionInput,
) {
  assertProposalId(teamId);
  const body =
    input.sectionKey === 'SCREEN'
      ? {
          ...input,
          screenConfiguration: input.screenConfiguration.map(screen => {
            const stored = { ...screen };
            delete stored.imageUrl;
            return stored;
          }),
        }
      : input;
  const response = await apiClient.put<unknown>(
    ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM(teamId),
    body,
  );
  return parseProjectProposal(response.data, teamId);
}
