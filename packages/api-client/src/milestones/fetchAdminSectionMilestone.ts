import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

import type { AdminSectionMilestoneDto } from './types';

export async function fetchAdminSectionMilestone(
  sectionId: string,
  milestoneId: string,
): Promise<AdminSectionMilestoneDto> {
  const response = await apiClient.get<AdminSectionMilestoneDto>(
    ENDPOINTS.ADMIN.SECTION_MILESTONE(sectionId, milestoneId),
  );

  return response.data;
}
