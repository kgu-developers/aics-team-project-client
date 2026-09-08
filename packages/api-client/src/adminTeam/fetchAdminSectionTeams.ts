import type { AdminSectionTeamsResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminSectionTeams(
  sectionId: string | number,
): Promise<AdminSectionTeamsResponse> {
  const response = await apiClient.get<AdminSectionTeamsResponse>(
    ENDPOINTS.ADMIN.SECTION_TEAMS(sectionId),
  );

  return response.data;
}
