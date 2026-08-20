import type { TopicBoard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTopicBoard(sectionId: string): Promise<TopicBoard> {
  const response = await apiClient.get<TopicBoard>(
    ENDPOINTS.TOPIC.BOARD(sectionId),
  );

  return response.data;
}
