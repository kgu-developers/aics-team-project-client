import type {
  MeetingActionEntry,
  MeetingActionListResponseDto,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingAction } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMeetingActionEntries(
  meetingRecordId: string,
): Promise<MeetingActionEntry[]> {
  const response = await apiClient.get<MeetingActionListResponseDto>(
    ENDPOINTS.MEETING.RECORD_ACTIONS(meetingRecordId),
  );

  return response.data.contents.map(mapMeetingAction);
}
