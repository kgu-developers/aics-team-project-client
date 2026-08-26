import { submitPresentationEvaluation } from '@aics/api-client';
import type { SubmitPresentationEvaluationInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { evaluationKeys } from './evaluationKeys';

export function useSubmitPresentationEvaluationMutation(
  sectionId: string,
  userId: string,
  milestoneId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitPresentationEvaluationInput) =>
      submitPresentationEvaluation(milestoneId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: evaluationKeys.presentation(sectionId, userId, milestoneId),
      });
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      });
    },
  });
}
