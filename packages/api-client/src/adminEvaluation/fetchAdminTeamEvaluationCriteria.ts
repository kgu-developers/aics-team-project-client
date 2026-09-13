import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminTeamEvaluationCriterionDto = {
  displayOrder: number;
  id: number;
  maxScore: number;
  title: string;
};

export type AdminTeamEvaluationCriteriaResponse = {
  contents: AdminTeamEvaluationCriterionDto[];
};

export async function fetchAdminTeamEvaluationCriteria(
  sectionId: string | number,
): Promise<AdminTeamEvaluationCriteriaResponse> {
  const response = await apiClient.get<AdminTeamEvaluationCriteriaResponse>(
    ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA(sectionId),
  );

  return response.data;
}
