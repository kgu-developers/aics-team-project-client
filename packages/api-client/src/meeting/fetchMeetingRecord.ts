import type { MeetingRecord } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMeetingRecord(
  meetingId: string,
): Promise<MeetingRecord> {
  const response = await apiClient.get<MeetingRecord>(
    ENDPOINTS.MEETING.RECORD(meetingId),
  );

  return response.data;
}
