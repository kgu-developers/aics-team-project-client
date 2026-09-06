import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

import type {
  AdminMilestoneCreateInput,
  AdminMilestonePersistResponse,
} from './types';

export async function submitAdminSectionMilestone(
  sectionId: string,
  input: AdminMilestoneCreateInput,
): Promise<AdminMilestonePersistResponse> {
  const response = await apiClient.post<AdminMilestonePersistResponse>(
    ENDPOINTS.ADMIN.SECTION_MILESTONES(sectionId),
    input,
  );

  return response.data;
}
