import { fetchMyTeamEvaluations } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useMyTeamEvaluationsQuery(userId: string, milestoneId: string) {
  return useQuery({
    queryKey: evaluationKeys.myTeamEvaluations(userId, milestoneId),
    queryFn:
      userId && milestoneId
        ? () => fetchMyTeamEvaluations(milestoneId)
        : skipToken,
  });
}
