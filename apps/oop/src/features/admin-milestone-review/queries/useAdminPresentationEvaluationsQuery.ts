import { fetchAdminPresentationEvaluations } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';

export function useAdminPresentationEvaluationsQuery(
  sectionId: string | undefined,
) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: adminPresentationEvaluationKeys.list(sectionId ?? ''),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminPresentationEvaluations(sectionId);
    },
  });
}
