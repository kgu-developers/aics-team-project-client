import type { MeetingRecordChangeLogListResponseDto } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMeetingRecordChangeLogs(
  meetingId: string,
  page = 0,
) {
  const response = await apiClient.get<MeetingRecordChangeLogListResponseDto>(
    ENDPOINTS.MEETING.RECORD_CHANGE_LOGS(meetingId),
    { params: { page } },
  );
  return response.data;
}
