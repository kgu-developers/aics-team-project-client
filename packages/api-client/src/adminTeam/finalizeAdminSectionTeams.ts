import type { AdminSectionTeamsResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function finalizeAdminSectionTeams(
  sectionId: string | number,
): Promise<AdminSectionTeamsResponse> {
  const response = await apiClient.patch<AdminSectionTeamsResponse>(
    ENDPOINTS.ADMIN.SECTION_TEAMS_FINALIZE(sectionId),
  );

  return response.data;
}
