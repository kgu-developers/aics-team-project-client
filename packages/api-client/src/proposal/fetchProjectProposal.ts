import { isAxiosError } from 'axios';

import { apiClient } from '../client';
import {
  assertProposalId,
  parseProjectProposal,
} from './projectProposalContract';
import { ENDPOINTS } from '../constants/endpoints';
export async function fetchProjectProposal(teamId: string) {
  assertProposalId(teamId);
  try {
    const response = await apiClient.get<unknown>(
      ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM(teamId),
    );
    return parseProjectProposal(response.data, teamId);
  } catch (error) {
    if (
      isAxiosError<{ code?: string }>(error) &&
      error.response?.status === 404 &&
      error.response.data.code === 'PROJECT_NOT_FOUND'
    )
      return null;
    throw error;
  }
}
