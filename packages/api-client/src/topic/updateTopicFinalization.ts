import type { TopicFinalizeInput, TopicFinalizeResponse } from '@aics/core';

import { apiClient } from '../client';
import { validateTopicId } from './topicApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateTopicFinalization(
  teamId: string,
  input: TopicFinalizeInput,
): Promise<TopicFinalizeResponse> {
  validateTopicId(teamId);
  if (!Number.isSafeInteger(input.candidateId) || input.candidateId <= 0) {
    throw new Error('유효한 주제 후보 식별자가 필요합니다.');
  }
  const goal = input.goal.trim();
  if (!goal) throw new Error('프로젝트 목표를 입력해 주세요.');
  const { data } = await apiClient.patch<TopicFinalizeResponse>(
    ENDPOINTS.TOPIC.FINALIZE(teamId),
    { candidateId: input.candidateId, goal },
  );
  if (
    !data ||
    !Number.isSafeInteger(data.projectId) ||
    data.projectId <= 0 ||
    data.candidateId !== input.candidateId ||
    typeof data.title !== 'string' ||
    !data.title.trim()
  ) {
    throw new Error('주제 확정 결과를 정확하게 확인할 수 없습니다.');
  }
  return data;
}
