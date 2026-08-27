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

export async function fetchAdminMeetingRecords(): Promise<AdminMeetingRecordsResponse> {
  const response = await apiClient.get<AdminMeetingRecordsResponse>(
    ENDPOINTS.ADMIN.MEETING_RECORDS,
  );

  return response.data;
}
