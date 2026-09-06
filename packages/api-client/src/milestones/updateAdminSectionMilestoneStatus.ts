import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

import type { AdminMilestoneStatus } from './types';

export async function updateAdminSectionMilestoneStatus(
  sectionId: string,
  milestoneId: string,
  status: AdminMilestoneStatus,
): Promise<void> {
  await apiClient.patch(
    ENDPOINTS.ADMIN.SECTION_MILESTONE_STATUS(sectionId, milestoneId),
    { status },
  );
}
