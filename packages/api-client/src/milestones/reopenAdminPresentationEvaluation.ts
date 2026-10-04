import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type ReopenAdminPresentationEvaluationInput = {
  evaluationClosesAt: string;
};

/** Reopens a closed PRESENTATION evaluation without changing its original start. */
export async function reopenAdminPresentationEvaluation(
  sectionId: string,
  milestoneId: string,
  input: ReopenAdminPresentationEvaluationInput,
): Promise<void> {
  await apiClient.patch(
    ENDPOINTS.ADMIN.SECTION_MILESTONE_EVALUATION_WINDOW_REOPEN(
      sectionId,
      milestoneId,
    ),
    input,
  );
}
