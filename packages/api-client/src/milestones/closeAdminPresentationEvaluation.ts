import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

/** Ends a running PRESENTATION evaluation at the server's current time. */
export async function closeAdminPresentationEvaluation(
  sectionId: string,
  milestoneId: string,
): Promise<void> {
  await apiClient.patch(
    ENDPOINTS.ADMIN.SECTION_MILESTONE_EVALUATION_WINDOW_CLOSE(
      sectionId,
      milestoneId,
    ),
  );
}
