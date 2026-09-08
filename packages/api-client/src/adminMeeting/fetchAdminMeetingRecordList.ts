import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMeetingRecordListItem = {
  authorId: string;
  content: string;
  id: number;
  location: string | null;
  meetingAt: string;
  participantCount: number;
  phase: 'FINAL' | 'MID_CHECK' | 'PROPOSAL';
  sectionId: number;
  sectionName: string;
  teamId: number;
  teamName: string;
};

export type AdminMeetingRecordListResponse = {
  contents: AdminMeetingRecordListItem[];
  pageable: {
    isEnd: boolean;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export type AdminMeetingRecordListFilter = {
  page?: number;
  sectionId?: number | string;
  size?: number;
};

export async function fetchAdminMeetingRecordList(
  filter: AdminMeetingRecordListFilter = {},
): Promise<AdminMeetingRecordListResponse> {
  const response = await apiClient.get<AdminMeetingRecordListResponse>(
    ENDPOINTS.ADMIN.MEETING_RECORDS_LIST,
    { params: filter },
  );

  return response.data;
}
