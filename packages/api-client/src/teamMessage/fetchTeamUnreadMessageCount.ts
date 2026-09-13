import type { TeamUnreadMessageCount } from '@aics/core';

import { apiClient } from '../client';
import { validateTeamMessageId } from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamUnreadMessageCount(
  teamId: string,
): Promise<TeamUnreadMessageCount> {
  validateTeamMessageId(teamId);
  const response = await apiClient.get<TeamUnreadMessageCount>(
    ENDPOINTS.TEAM_MESSAGE.UNREAD_COUNT(teamId),
  );

  return response.data;
}
