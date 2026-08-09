import type { Team } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeams(sectionId: string): Promise<Team[]> {
  const response = await apiClient.get<Team[]>(ENDPOINTS.TEAM.ROOT, {
    params: { sectionId },
  });

  return response.data;
}
