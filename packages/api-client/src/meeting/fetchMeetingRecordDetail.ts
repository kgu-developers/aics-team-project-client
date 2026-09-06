import type {
  MeetingRecordDetail,
  MeetingRecordDetailResponseDto,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingRecordDetail } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMeetingRecordDetail(
  meetingId: string,
): Promise<MeetingRecordDetail> {
  const response = await apiClient.get<MeetingRecordDetailResponseDto>(
    ENDPOINTS.MEETING.RECORD(meetingId),
  );

  return mapMeetingRecordDetail(response.data);
}
