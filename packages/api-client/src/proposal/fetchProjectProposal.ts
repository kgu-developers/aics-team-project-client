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
    const body = isAxiosError<unknown>(error) ? error.response?.data : null;
    if (
      isAxiosError(error) &&
      error.response?.status === 404 &&
      typeof body === 'object' &&
      body !== null &&
      (body as { code?: unknown }).code === 'PROJECT_NOT_FOUND'
    )
      return null;
    throw error;
  }
}
