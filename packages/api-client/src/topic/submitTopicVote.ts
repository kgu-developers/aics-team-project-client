import type { SubmitTopicVoteInput, TopicBoard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTopicVote(
  sectionId: string,
  input: SubmitTopicVoteInput,
): Promise<TopicBoard> {
  const response = await apiClient.put<TopicBoard>(
    ENDPOINTS.TOPIC.VOTE(sectionId),
    input,
  );

  return response.data;
}
