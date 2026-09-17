import { apiClient } from '../client';
import type { AdminProposalFeedbackDto } from './fetchAdminProposalFeedbacks';
import { ENDPOINTS } from '../constants/endpoints';

export type SubmitAdminProposalFeedbackInput = {
  message: string;
};

export async function submitAdminProposalFeedback(
  sectionId: string | number,
  teamId: string | number,
  input: SubmitAdminProposalFeedbackInput,
): Promise<AdminProposalFeedbackDto> {
  const response = await apiClient.post<AdminProposalFeedbackDto>(
    `${ENDPOINTS.ADMIN.SECTION_TEAM_PROPOSAL(sectionId, teamId)}/feedback`,
    input,
  );

  return response.data;
}
