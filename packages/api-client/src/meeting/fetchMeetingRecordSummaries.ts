import type {
  MeetingPhase,
  MeetingRecordListResponseDto,
  MeetingRecordSummary,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingRecordSummary } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMeetingRecordSummaries(
  teamId: string,
  phase?: MeetingPhase,
): Promise<MeetingRecordSummary[]> {
  const response = await apiClient.get<MeetingRecordListResponseDto>(
    ENDPOINTS.MEETING.RECORDS(teamId),
    { params: phase ? { phase } : undefined },
  );

  return response.data.contents.map(mapMeetingRecordSummary);
}
