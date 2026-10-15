import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeAdminSectionMilestone(
  sectionId: string,
  milestoneId: string,
): Promise<void> {
  await apiClient.delete(
    ENDPOINTS.ADMIN.SECTION_MILESTONE(sectionId, milestoneId),
  );
}
