import type { MyTeamMilestoneSubmissionResponse } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMyTeamMilestoneSubmission(
  milestoneId: string,
  teamId: string,
) {
  const { data } = await apiClient.get<MyTeamMilestoneSubmissionResponse>(
    ENDPOINTS.STUDENT_MILESTONE.MY_TEAM_SUBMISSION(milestoneId),
  );
  if (
    data.milestoneId !== Number(milestoneId) ||
    data.teamId !== Number(teamId) ||
    !Number.isSafeInteger(data.id) ||
    data.id <= 0 ||
    !Number.isInteger(data.currentVersion)
  ) {
    throw new Error('내 팀 제출 정보를 확인할 수 없습니다.');
  }
  return data;
}
