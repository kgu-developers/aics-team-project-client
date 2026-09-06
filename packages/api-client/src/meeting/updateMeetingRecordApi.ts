import type {
  MeetingRecordPersistResponseDto,
  MeetingRecordPersistResult,
  MeetingRecordUpdateRequest,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingRecordPersistResult } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateMeetingRecordApi(
  meetingId: string,
  input: MeetingRecordUpdateRequest,
): Promise<MeetingRecordPersistResult> {
  const response = await apiClient.patch<MeetingRecordPersistResponseDto>(
    ENDPOINTS.MEETING.RECORD(meetingId),
    input,
  );

  return mapMeetingRecordPersistResult(response.data);
}
