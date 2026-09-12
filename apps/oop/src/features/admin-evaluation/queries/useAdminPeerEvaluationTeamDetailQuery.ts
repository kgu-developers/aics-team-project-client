import {
  fetchAdminPeerEvaluationTeamDetail,
  type AdminPeerEvaluationListInput,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminEvaluationKeys } from './adminEvaluationKeys';

export function useAdminPeerEvaluationTeamDetailQuery(
  sectionId: string | undefined,
  teamId: number | undefined,
  input: AdminPeerEvaluationListInput = {},
) {
  return useQuery({
    enabled: Boolean(sectionId && teamId),
    retry: false,
    queryKey: adminEvaluationKeys.peerEvaluation.detail(
      sectionId ?? '',
      teamId ?? 0,
      input.formId,
    ),
    queryFn: () => {
      if (!sectionId || !teamId) throw new Error('분반과 팀 ID가 필요합니다.');
      return fetchAdminPeerEvaluationTeamDetail(sectionId, {
        ...input,
        teamId,
      });
    },
  });
}
