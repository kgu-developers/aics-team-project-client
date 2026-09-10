import type {
  TeamMeetingActionEntry,
  TeamMeetingActionListResponseDto,
  MeetingApiActionStatus,
} from '@aics/core';

import { apiClient } from '../client';
import { mapTeamMeetingAction } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamMeetingActionEntries(
  teamId: string,
  status?: MeetingApiActionStatus,
): Promise<TeamMeetingActionEntry[]> {
  const response = await apiClient.get<TeamMeetingActionListResponseDto>(
    ENDPOINTS.MEETING.ACTIONS(teamId),
    { params: status ? { status } : undefined },
  );

  return response.data.contents.map(mapTeamMeetingAction);
}
