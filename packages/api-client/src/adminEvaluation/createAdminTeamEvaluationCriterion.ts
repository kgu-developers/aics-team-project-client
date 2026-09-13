import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminTeamEvaluationCriterionCreateInput = {
  displayOrder: number;
  maxScore: number;
  title: string;
};

export type AdminTeamEvaluationCriterionPersistResponse = {
  id: number;
};

export async function createAdminTeamEvaluationCriterion(
  sectionId: string | number,
  input: AdminTeamEvaluationCriterionCreateInput,
): Promise<AdminTeamEvaluationCriterionPersistResponse> {
  const response =
    await apiClient.post<AdminTeamEvaluationCriterionPersistResponse>(
      ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA(sectionId),
      input,
    );

  return response.data;
}
