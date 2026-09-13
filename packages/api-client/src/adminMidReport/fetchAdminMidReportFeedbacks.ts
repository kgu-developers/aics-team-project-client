import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMidReportFeedbackDto = {
  createdAt: string | null;
  message: string;
  messageId: number;
  midReportId: number;
  senderId: string;
  senderName: string | null;
  teamId: number;
};

export type AdminMidReportFeedbacksResponse = {
  contents: AdminMidReportFeedbackDto[];
  pageable: {
    isEnd: boolean;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export async function fetchAdminMidReportFeedbacks(
  sectionId: string | number,
  teamId: string | number,
  page = 0,
  size = 20,
): Promise<AdminMidReportFeedbacksResponse> {
  const response = await apiClient.get<AdminMidReportFeedbacksResponse>(
    `${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT(sectionId, teamId)}/feedbacks`,
    { params: { page, size } },
  );

  return response.data;
}
