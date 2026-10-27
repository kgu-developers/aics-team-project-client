import type {
  TopicDirectFinalizeInput,
  TopicFinalizeResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { validateTopicId } from './topicApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateTopicDirectFinalization(
  teamId: string,
  input: TopicDirectFinalizeInput,
): Promise<TopicFinalizeResponse> {
  validateTopicId(teamId);
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || title.length > 200 || !description)
    throw new Error('제목(200자 이내)과 설명을 입력해 주세요.');
  const { data } = await apiClient.patch<TopicFinalizeResponse>(
    ENDPOINTS.TOPIC.DIRECT_FINALIZE(teamId),
    { title, description },
  );
  if (
    !data ||
    !Number.isSafeInteger(data.projectId) ||
    data.projectId <= 0 ||
    data.candidateId !== null ||
    typeof data.title !== 'string' ||
    !data.title.trim()
  )
    throw new Error('주제 확정 결과를 정확하게 확인할 수 없습니다.');
  return data;
}
