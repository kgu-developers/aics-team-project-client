import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSectionMeetingRecordEditLog = {
  createdAt: string;
  editorId: string;
  editorName: string | null;
  id: number;
  meetingRecordId: number;
  meetingRecordTitle: string | null;
  reason: string;
  teamId: number;
  teamName: string | null;
};

export type AdminSectionMeetingRecordEditLogsFilter = {
  meetingRecordId?: number | string;
  page?: number;
  size?: number;
  teamId?: number | string;
};

export type AdminSectionMeetingRecordEditLogsResponse = {
  contents: AdminSectionMeetingRecordEditLog[];
  pageable: {
    isEnd: boolean;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export async function fetchAdminSectionMeetingRecordLogs(
  sectionId: string | number,
  filter: AdminSectionMeetingRecordEditLogsFilter = {},
): Promise<AdminSectionMeetingRecordEditLogsResponse> {
  const response =
    await apiClient.get<AdminSectionMeetingRecordEditLogsResponse>(
      ENDPOINTS.ADMIN.SECTION_MEETING_RECORD_LOGS(sectionId),
      { params: filter },
    );

  return response.data;
}
