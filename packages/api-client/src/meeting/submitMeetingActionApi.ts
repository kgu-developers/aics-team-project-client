import type {
  MeetingActionCreateRequest,
  MeetingActionEntry,
  MeetingActionResponseDto,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingAction } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMeetingActionApi(
  meetingRecordId: string,
  input: MeetingActionCreateRequest,
): Promise<MeetingActionEntry> {
  const response = await apiClient.post<MeetingActionResponseDto>(
    ENDPOINTS.MEETING.RECORD_ACTIONS(meetingRecordId),
    input,
  );

  return mapMeetingAction(response.data);
}
