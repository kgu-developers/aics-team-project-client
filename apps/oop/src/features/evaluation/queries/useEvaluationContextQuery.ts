import { fetchEvaluationContext } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useEvaluationContextQuery(sectionId: string, userId: string) {
  return useQuery({
    enabled: Boolean(sectionId && userId),
    queryKey: evaluationKeys.context(sectionId, userId),
    queryFn: () => fetchEvaluationContext(sectionId),
  });
}
