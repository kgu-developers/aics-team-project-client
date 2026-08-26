import { fetchTeamEvaluationCriteria } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useTeamEvaluationCriteriaQuery(sectionId: string) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: evaluationKeys.criteria(sectionId),
    queryFn: () => fetchTeamEvaluationCriteria(sectionId),
  });
}
