import {
  fetchAdminPresentationEvaluations,
  type AdminPresentationEvaluationListInput,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminEvaluationKeys } from './adminEvaluationKeys';

export function useAdminPresentationEvaluationsQuery(
  sectionId: string | undefined,
  input: AdminPresentationEvaluationListInput = {},
) {
  return useQuery({
    enabled: Boolean(sectionId),
    retry: false,
    queryKey: adminEvaluationKeys.presentationEvaluation.list(
      sectionId ?? '',
      input.milestoneId,
    ),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminPresentationEvaluations(sectionId, input);
    },
  });
}
