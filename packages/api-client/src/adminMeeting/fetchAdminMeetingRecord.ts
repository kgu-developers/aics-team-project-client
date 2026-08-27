import type { MeetingRecord } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMeetingRecordDetailDto = MeetingRecord & {
  sectionId: string;
  sectionLabel: string;
  teamLabel: string;
};

export async function fetchAdminMeetingRecord(
  meetingId: string,
  sectionId: string,
): Promise<AdminMeetingRecordDetailDto> {
  const response = await apiClient.get<AdminMeetingRecordDetailDto>(
    ENDPOINTS.ADMIN.MEETING_RECORD(meetingId),
    { params: { sectionId } },
  );

  return response.data;
}
