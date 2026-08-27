import type { MeetingRecord } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMeetingRecords(
  teamId: string,
): Promise<MeetingRecord[]> {
  const response = await apiClient.get<MeetingRecord[]>(
    ENDPOINTS.MEETING.RECORDS(teamId),
  );

  return response.data;
}
