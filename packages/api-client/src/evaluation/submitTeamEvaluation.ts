import type { SubmitTeamEvaluationInput, TeamEvaluationDto } from '@aics/core';

import { apiClient } from '../client';
import { parseTeamEvaluation } from './teamEvaluationContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTeamEvaluation(
  milestoneId: string,
  teamId: string,
  input: SubmitTeamEvaluationInput,
): Promise<TeamEvaluationDto> {
  if (!input.scores.length)
    throw new Error('평가 점수를 한 개 이상 입력해 주세요.');
  const response = await apiClient.put<unknown>(
    ENDPOINTS.EVALUATION.TEAM_EVALUATION(milestoneId, teamId),
    input,
  );
  return parseTeamEvaluation(response.data);
}
