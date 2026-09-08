import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMeetingRecordDetailResponse = {
  authorId: string;
  content: string;
  createdAt: string;
  id: number;
  location: string | null;
  meetingAt: string;
  participantIds: string[];
  phase: 'FINAL' | 'MID_CHECK' | 'PROPOSAL';
  sectionId: number;
  sectionName: string;
  teamId: number;
  teamName: string;
  title: string;
  updatedAt: string;
};

export async function fetchAdminMeetingRecordDetail(
  meetingId: string | number,
): Promise<AdminMeetingRecordDetailResponse> {
  const response = await apiClient.get<AdminMeetingRecordDetailResponse>(
    ENDPOINTS.ADMIN.MEETING_RECORD_DETAIL(meetingId),
  );

  return response.data;
}
