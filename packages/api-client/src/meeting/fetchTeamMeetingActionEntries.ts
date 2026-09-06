import type {
  MeetingActionEntry,
  MeetingActionListResponseDto,
  MeetingApiActionStatus,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingAction } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamMeetingActionEntries(
  teamId: string,
  status?: MeetingApiActionStatus,
): Promise<MeetingActionEntry[]> {
  const response = await apiClient.get<MeetingActionListResponseDto>(
    ENDPOINTS.MEETING.ACTIONS(teamId),
    { params: status ? { status } : undefined },
  );

  return response.data.contents.map(mapMeetingAction);
}
