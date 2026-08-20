import type { TopicBoard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeTopicVote(sectionId: string): Promise<TopicBoard> {
  const response = await apiClient.delete<TopicBoard>(
    ENDPOINTS.TOPIC.VOTE(sectionId),
  );

  return response.data;
}
