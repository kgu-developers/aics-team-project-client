import { apiClient } from '../client';
import type { AdminMilestoneStatus } from './types';
import { ENDPOINTS } from '../constants/endpoints';

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
