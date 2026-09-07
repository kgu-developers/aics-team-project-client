import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminPreSurveyResponseDto = {
  etcOpinion?: string | null;
  id: number;
  preferredRoles: string[];
  submittedAt: string;
  topicOpinion?: string | null;
  userId: string;
  userName: string;
};

export type AdminPreSurveyResponsesResponse = {
  contents: AdminPreSurveyResponseDto[];
};

export async function fetchAdminPreSurveyResponses(
  sectionId: string,
): Promise<AdminPreSurveyResponsesResponse> {
  const response = await apiClient.get<AdminPreSurveyResponsesResponse>(
    ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES(sectionId),
  );

  return response.data;
}
