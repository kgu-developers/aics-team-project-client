import {
  fetchAdminPeerEvaluations,
  type AdminPeerEvaluationListInput,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminEvaluationKeys } from './adminEvaluationKeys';

export function useAdminPeerEvaluationsQuery(
  sectionId: string | undefined,
  input: AdminPeerEvaluationListInput = {},
) {
  return useQuery({
    enabled: Boolean(sectionId),
    retry: false,
    queryKey: adminEvaluationKeys.peerEvaluation.list(
      sectionId ?? '',
      input.formId,
    ),
    queryFn: () => {
      if (!sectionId) throw new Error('분반 ID가 필요합니다.');
      return fetchAdminPeerEvaluations(sectionId, input);
    },
  });
}
