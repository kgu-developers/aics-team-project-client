import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';
import type {
  AdminMilestoneStatus,
  AdminSectionMilestonesResponse,
} from './types';

export async function fetchAdminSectionMilestones(
  sectionId: string,
  status?: AdminMilestoneStatus,
): Promise<AdminSectionMilestonesResponse> {
  const response = await apiClient.get<AdminSectionMilestonesResponse>(
    ENDPOINTS.ADMIN.SECTION_MILESTONES(sectionId),
    { params: status ? { status } : undefined },
  );

  return response.data;
}
