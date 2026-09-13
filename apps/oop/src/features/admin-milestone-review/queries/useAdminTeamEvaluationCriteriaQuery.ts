import { fetchAdminTeamEvaluationCriteria } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminTeamEvaluationCriteriaKeys } from './adminTeamEvaluationCriteriaKeys';

export function useAdminTeamEvaluationCriteriaQuery(
  sectionId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminTeamEvaluationCriteria(sectionId);
    },
    queryKey: sectionId
      ? adminTeamEvaluationCriteriaKeys.list(sectionId)
      : ([...adminTeamEvaluationCriteriaKeys.all, 'disabled'] as const),
  });
}
