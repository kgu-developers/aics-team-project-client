import type { TeamMessagePage, TeamMessagesParams } from '@aics/core';

import { apiClient } from '../client';
import {
  validateTeamMessageId,
  validateTeamMessageResponseIds,
} from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamMessages(
  teamId: string,
  params: TeamMessagesParams = {},
  options?: { signal?: AbortSignal },
): Promise<TeamMessagePage> {
  validateTeamMessageId(teamId);
  const response = await apiClient.get<TeamMessagePage>(
    ENDPOINTS.TEAM_MESSAGE.BY_TEAM(teamId),
    { params, signal: options?.signal },
  );
  response.data.contents.forEach(validateTeamMessageResponseIds);
  return response.data;
}
