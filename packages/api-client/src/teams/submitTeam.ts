import type { Team } from '@aics/core';

import { apiClient } from '../client';

export type SubmitTeamInput = {
  sectionId: string;
  name: string;
};

export async function submitTeam(input: SubmitTeamInput): Promise<Team> {
  const response = await apiClient.post<Team>('/teams', input);

  return response.data;
}
