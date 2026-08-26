import { fetchMyPresentationEvaluations } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useMyPresentationEvaluationsQuery(
  sectionId: string,
  userId: string,
  milestoneId: string,
) {
  return useQuery({
    enabled: Boolean(sectionId && userId && milestoneId),
    queryKey: evaluationKeys.presentation(sectionId, userId, milestoneId),
    queryFn: () => fetchMyPresentationEvaluations(milestoneId),
  });
}
