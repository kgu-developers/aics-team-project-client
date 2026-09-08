import type { TeamProjectResponse } from '@aics/core';
import { isAxiosError } from 'axios';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamProject(
  teamId: string,
): Promise<TeamProjectResponse | null> {
  const response = await apiClient
    .get<TeamProjectResponse>(ENDPOINTS.PROJECT.BY_TEAM(teamId))
    .catch((error: unknown) => {
      if (
        isAxiosError<{ code?: string }>(error) &&
        error.response?.status === 404 &&
        error.response.data.code === 'PROJECT_NOT_FOUND'
      )
        return null;
      throw error;
    });
  if (response === null) return null;

  if (
    !Number.isSafeInteger(response.data.id) ||
    response.data.id <= 0 ||
    String(response.data.teamId) !== teamId
  ) {
    throw new Error('우리 팀의 프로젝트인지 확인할 수 없습니다.');
  }

  for (const field of ['goal', 'proposalCompletedAt'] as const) {
    const value = response.data[field];
    if (value != null && typeof value !== 'string') {
      throw new Error('프로젝트 목표와 완료 상태를 확인할 수 없습니다.');
    }
  }
  return response.data;
}
