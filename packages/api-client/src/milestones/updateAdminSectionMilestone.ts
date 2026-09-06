import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

import type { AdminMilestoneUpdateInput } from './types';

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
