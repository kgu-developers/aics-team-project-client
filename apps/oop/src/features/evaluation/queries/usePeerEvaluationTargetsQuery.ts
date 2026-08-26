import { fetchPeerEvaluationTargets } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function usePeerEvaluationTargetsQuery(
  sectionId: string,
  userId: string,
  formId: string,
) {
  return useQuery({
    enabled: Boolean(sectionId && userId && formId),
    queryKey: evaluationKeys.peer(sectionId, userId, formId),
    queryFn: () => fetchPeerEvaluationTargets(formId),
  });
}
