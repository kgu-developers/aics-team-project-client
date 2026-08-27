import type { CreateMeetingRecordInput, MeetingRecord } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMeetingRecord(
  teamId: string,
  input: CreateMeetingRecordInput,
): Promise<MeetingRecord> {
  const response = await apiClient.post<MeetingRecord>(
    ENDPOINTS.MEETING.RECORDS(teamId),
    input,
  );

  return response.data;
}
