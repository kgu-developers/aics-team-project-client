import type { MeetingRecord, UpdateMeetingRecordInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateMeetingRecord(
  meetingId: string,
  input: UpdateMeetingRecordInput,
): Promise<MeetingRecord> {
  const response = await apiClient.put<MeetingRecord>(
    ENDPOINTS.MEETING.RECORD(meetingId),
    input,
  );

  return response.data;
}
