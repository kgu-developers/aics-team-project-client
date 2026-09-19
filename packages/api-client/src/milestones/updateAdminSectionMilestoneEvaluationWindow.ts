import { apiClient } from '../client';
import type { AdminMilestoneEvaluationWindowInput } from './types';
import { ENDPOINTS } from '../constants/endpoints';

/**
 * Changes only the evaluation window (PRESENTATION: 발표 평가 기간) so the
 * rest of the schedule is not re-submitted. Pass `clearEvaluationWindow`
 * with no dates to remove the window.
 */
export async function updateAdminSectionMilestoneEvaluationWindow(
  sectionId: string,
  milestoneId: string,
  input: AdminMilestoneEvaluationWindowInput,
): Promise<void> {
  await apiClient.patch(
    ENDPOINTS.ADMIN.SECTION_MILESTONE_EVALUATION_WINDOW(sectionId, milestoneId),
    input,
  );
}
