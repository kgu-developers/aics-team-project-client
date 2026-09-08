import type {
  SubmitTopicCandidateInput,
  TopicCandidatePersistResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { validateTopicCandidate, validateTopicId } from './topicApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTeamTopicCandidate(
  teamId: string,
  input: SubmitTopicCandidateInput,
): Promise<TopicCandidatePersistResponse> {
  validateTopicId(teamId);
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || title.length > 200 || !description) {
    throw new Error('제목은 200자 이내, 설명은 빈칸 없이 입력해 주세요.');
  }
  const response = await apiClient.post<unknown>(
    ENDPOINTS.TOPIC.CANDIDATES(teamId),
    { title, description },
  );
  validateTopicCandidate(response.data);
  return response.data;
}
