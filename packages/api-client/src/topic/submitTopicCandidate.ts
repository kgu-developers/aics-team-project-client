import type { SubmitTopicCandidateInput, TopicBoard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTopicCandidate(
  sectionId: string,
  input: SubmitTopicCandidateInput,
): Promise<TopicBoard> {
  const response = await apiClient.post<TopicBoard>(
    ENDPOINTS.TOPIC.BOARD(sectionId),
    input,
  );

  return response.data;
}
