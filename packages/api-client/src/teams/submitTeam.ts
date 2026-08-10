import type { SubmitTeamInput, Team } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTeam(input: SubmitTeamInput): Promise<Team> {
  const response = await apiClient.post<Team>(ENDPOINTS.TEAM.ROOT, input);

  return response.data;
}
