import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminProposalFeedbackDto = {
  createdAt: string | null;
  message: string;
  messageId: number;
  projectId: number;
  senderId: string;
  senderName: string | null;
  teamId: number;
};

export type AdminProposalFeedbacksResponse = {
  contents: AdminProposalFeedbackDto[];
  pageable: {
    isEnd: boolean;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export async function fetchAdminProposalFeedbacks(
  sectionId: string | number,
  teamId: string | number,
  page = 0,
  size = 20,
): Promise<AdminProposalFeedbacksResponse> {
  const response = await apiClient.get<AdminProposalFeedbacksResponse>(
    `${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL(sectionId, teamId)}/feedbacks`,
    { params: { page, size } },
  );

  return response.data;
}
