import type { TeamThread } from '@aics/core';

import { apiClient } from '../client';
import { validateTeamMessageId } from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamThread(
  teamId: string,
  options?: { signal?: AbortSignal },
): Promise<TeamThread> {
  validateTeamMessageId(teamId);
  const response = await apiClient.get<TeamThread>(
    ENDPOINTS.TEAM_THREAD.BY_TEAM(teamId),
    { signal: options?.signal },
  );
  validateTeamMessageId(response.data.threadId);
  validateTeamMessageId(response.data.teamId);
  return response.data;
}
