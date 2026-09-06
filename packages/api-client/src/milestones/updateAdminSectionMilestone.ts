import { apiClient } from '../client';
import type { AdminMilestoneUpdateInput } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateAdminSectionMilestone(
  sectionId: string,
  milestoneId: string,
  input: AdminMilestoneUpdateInput,
): Promise<void> {
  await apiClient.put(
    ENDPOINTS.ADMIN.SECTION_MILESTONE(sectionId, milestoneId),
    input,
  );
}
