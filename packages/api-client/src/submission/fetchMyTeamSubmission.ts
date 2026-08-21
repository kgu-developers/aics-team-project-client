import type { Submission } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchMyTeamSubmission(
  milestoneId: string,
): Promise<Submission> {
  const response = await apiClient.get<Submission>(
    ENDPOINTS.SUBMISSION.MY_TEAM_BY_MILESTONE(milestoneId),
  );

  return response.data;
}
