import type { TeamKickoffResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

function isSafeId(id: number) {
  return Number.isSafeInteger(id) && id > 0;
}

export async function fetchTeamKickoff(
  teamId: string,
): Promise<TeamKickoffResponse> {
  const response = await apiClient.get<TeamKickoffResponse>(
    ENDPOINTS.TEAM.KICKOFF(teamId),
  );

  // A rounded JSON identifier cannot be recovered by converting it to a string.
  if (
    !isSafeId(response.data.id) ||
    response.data.members.some(member => !isSafeId(member.id))
  ) {
    throw new Error('팀 식별자를 정확하게 확인할 수 없습니다.');
  }

  return response.data;
}
