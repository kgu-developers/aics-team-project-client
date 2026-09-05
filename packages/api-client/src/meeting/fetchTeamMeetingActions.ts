import type { TeamMeetingAction } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamMeetingActions(
  teamId: string,
): Promise<TeamMeetingAction[]> {
  const response = await apiClient.get<TeamMeetingAction[]>(
    ENDPOINTS.MEETING.ACTIONS(teamId),
  );
  return response.data;
}
