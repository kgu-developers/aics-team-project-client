import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminTeamEvaluationCriterionUpdateInput = {
  displayOrder: number;
  maxScore: number;
  title: string;
};

export async function updateAdminTeamEvaluationCriterion(
  sectionId: string | number,
  criterionId: string | number,
  input: AdminTeamEvaluationCriterionUpdateInput,
): Promise<void> {
  await apiClient.patch(
    ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERION(sectionId, criterionId),
    input,
  );
}
