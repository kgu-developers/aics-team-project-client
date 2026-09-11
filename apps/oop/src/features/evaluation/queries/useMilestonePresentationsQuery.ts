import { fetchMilestonePresentations } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useMilestonePresentationsQuery(
  sectionId: string,
  userId: string,
  milestoneId: string,
) {
  return useQuery({
    enabled: Boolean(milestoneId),
    queryKey: evaluationKeys.presentationRoster(sectionId, userId, milestoneId),
    queryFn: () => fetchMilestonePresentations(milestoneId),
  });
}
