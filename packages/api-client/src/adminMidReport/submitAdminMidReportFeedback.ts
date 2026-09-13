import { apiClient } from '../client';
import type { AdminMidReportFeedbackDto } from './fetchAdminMidReportFeedbacks';
import { ENDPOINTS } from '../constants/endpoints';

export type SubmitAdminMidReportFeedbackInput = {
  affectedBlockKeys?: string[];
  message: string;
};

export async function submitAdminMidReportFeedback(
  sectionId: string | number,
  teamId: string | number,
  input: SubmitAdminMidReportFeedbackInput,
): Promise<AdminMidReportFeedbackDto> {
  const response = await apiClient.post<AdminMidReportFeedbackDto>(
    `${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT(sectionId, teamId)}/feedback`,
    input,
  );

  return response.data;
}
