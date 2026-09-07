import type { TeamKickoffResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamKickoff(
  teamId: string,
): Promise<TeamKickoffResponse> {
  const response = await apiClient.get<TeamKickoffResponse>(
    ENDPOINTS.TEAM.KICKOFF(teamId),
  );

  return response.data;
}
