import type { Team } from '@aics/core';

import { apiClient } from '../client';

export async function fetchTeams(sectionId: string): Promise<Team[]> {
  const response = await apiClient.get<Team[]>('/teams', {
    params: { sectionId },
  });

  return response.data;
}
