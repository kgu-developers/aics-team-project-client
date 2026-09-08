import type { TopicVotePersistResponse } from '@aics/core';

import { apiClient } from '../client';
import { validateTopicId, validateTopicVote } from './topicApiContract';
import { ENDPOINTS } from '../constants/endpoints';

/** The server replaces this student's previous vote in the same team. */
export async function submitTopicCandidateVote(
  candidateId: string,
): Promise<TopicVotePersistResponse> {
  validateTopicId(candidateId);
  const response = await apiClient.post<unknown>(
    ENDPOINTS.TOPIC.CANDIDATE_VOTE(candidateId),
  );
  validateTopicVote(response.data, candidateId);
  return response.data;
}
