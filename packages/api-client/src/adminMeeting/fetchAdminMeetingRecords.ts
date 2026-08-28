import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMeetingRecordSummaryDto = {
  createdAt: string;
  id: string;
  sectionId: string;
  sectionLabel: string;
  teamId: string;
  teamLabel: string;
  title: string;
};

export type AdminMeetingRecordsResponse = {
  records: AdminMeetingRecordSummaryDto[];
};

export type AdminMeetingRecordsFilter = {
  sectionId?: string;
  teamId?: string;
};

export async function fetchAdminMeetingRecords(
  filter: AdminMeetingRecordsFilter = {},
): Promise<AdminMeetingRecordsResponse> {
  const response = await apiClient.get<AdminMeetingRecordsResponse>(
    ENDPOINTS.ADMIN.MEETING_RECORDS,
    { params: filter },
  );

  return response.data;
}
