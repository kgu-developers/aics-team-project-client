import type { AdminTeamDetailDto } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminTeam(
  teamId: string | number,
): Promise<AdminTeamDetailDto> {
  const response = await apiClient.get<AdminTeamDetailDto>(
    ENDPOINTS.ADMIN.TEAM(teamId),
  );

  return response.data;
}
