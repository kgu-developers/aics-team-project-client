import { apiClient } from '../client';
import type { AdminMeetingRecordListResponse } from './fetchAdminMeetingRecordList';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMeetingRecordSummaryDto = {
  createdAt: string;
  authorName?: string;
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
  const response = await apiClient.get<AdminMeetingRecordListResponse>(
    ENDPOINTS.ADMIN.MEETING_RECORDS_LIST,
    { params: filter },
  );
  return {
    records: response.data.contents.map(record => ({
      createdAt: record.meetingAt,
      id: String(record.id),
      sectionId: String(record.sectionId),
      sectionLabel: record.sectionName,
      teamId: String(record.teamId),
      teamLabel: record.teamName,
      title: record.title,
    })),
  };
}
