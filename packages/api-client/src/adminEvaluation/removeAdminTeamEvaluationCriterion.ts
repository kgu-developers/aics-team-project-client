import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeAdminTeamEvaluationCriterion(
  sectionId: string | number,
  criterionId: string | number,
): Promise<void> {
  await apiClient.delete(
    ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERION(sectionId, criterionId),
  );
}
