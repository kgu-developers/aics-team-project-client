import type {
  MeetingRecordCreateRequest,
  MeetingRecordPersistResponseDto,
  MeetingRecordPersistResult,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingRecordPersistResult } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMeetingRecordApi(
  teamId: string,
  input: MeetingRecordCreateRequest,
): Promise<MeetingRecordPersistResult> {
  const response = await apiClient.post<MeetingRecordPersistResponseDto>(
    ENDPOINTS.MEETING.RECORDS(teamId),
    input,
  );

  return mapMeetingRecordPersistResult(response.data);
}
