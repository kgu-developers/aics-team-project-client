import { fetchTopicBoard } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { topicKeys } from './topicKeys';

export function useTopicBoardQuery(sectionId: string) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: topicKeys.board(sectionId),
    queryFn: () => fetchTopicBoard(sectionId),
  });
}
