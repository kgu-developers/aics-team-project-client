import type { TopicCandidateResponse } from '@aics/core';

import { apiClient } from '../client';
import { validateTopicCandidates, validateTopicId } from './topicApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTopicCandidates(
  teamId: string,
): Promise<TopicCandidateResponse[]> {
  validateTopicId(teamId);
  const response = await apiClient.get<unknown>(
    ENDPOINTS.TOPIC.CANDIDATES(teamId),
  );
  validateTopicCandidates(response.data);
  return response.data.contents;
}
