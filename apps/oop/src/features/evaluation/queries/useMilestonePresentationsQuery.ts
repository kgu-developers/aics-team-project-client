import { fetchMilestonePresentations } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useMilestonePresentationsQuery(milestoneId: string) {
  return useQuery({
    queryKey: evaluationKeys.presentationRoster(milestoneId),
    queryFn: milestoneId
      ? () => fetchMilestonePresentations(milestoneId)
      : skipToken,
  });
}
