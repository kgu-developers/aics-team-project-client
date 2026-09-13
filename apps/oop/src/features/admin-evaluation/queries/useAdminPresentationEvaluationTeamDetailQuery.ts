import {
  fetchAdminPresentationEvaluationTeamDetail,
  type AdminPresentationEvaluationListInput,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminEvaluationKeys } from './adminEvaluationKeys';

export function useAdminPresentationEvaluationTeamDetailQuery(
  sectionId: string | undefined,
  teamId: number | undefined,
  input: AdminPresentationEvaluationListInput = {},
) {
  return useQuery({
    enabled: Boolean(sectionId && teamId),
    retry: false,
    queryKey: adminEvaluationKeys.presentationEvaluation.detail(
      sectionId ?? '',
      teamId ?? 0,
      input.milestoneId,
    ),
    queryFn: () => {
      if (!sectionId || !teamId) throw new Error('분반과 팀 ID가 필요합니다.');
      return fetchAdminPresentationEvaluationTeamDetail(sectionId, {
        ...input,
        teamId,
      });
    },
  });
}
