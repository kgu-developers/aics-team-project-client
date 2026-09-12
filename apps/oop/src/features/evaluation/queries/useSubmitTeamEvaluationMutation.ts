import { submitTeamEvaluation } from '@aics/api-client';
import type { SubmitTeamEvaluationInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { evaluationKeys } from './evaluationKeys';

export function useSubmitTeamEvaluationMutation(
  userId: string,
  milestoneId: string,
) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      teamId,
      input,
    }: {
      teamId: string;
      input: SubmitTeamEvaluationInput;
    }) => submitTeamEvaluation(milestoneId, teamId, input),
    onSuccess: () =>
      client.invalidateQueries({
        queryKey: evaluationKeys.myTeamEvaluations(userId, milestoneId),
      }),
  });
}
