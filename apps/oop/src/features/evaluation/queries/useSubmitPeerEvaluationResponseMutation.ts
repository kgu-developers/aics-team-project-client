import { submitPeerEvaluationResponse } from '@aics/api-client';
import type { SubmitPeerEvaluationResponseInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { evaluationKeys } from './evaluationKeys';

export function useSubmitPeerEvaluationResponseMutation(
  sectionId: string,
  userId: string,
  formId: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitPeerEvaluationResponseInput) =>
      submitPeerEvaluationResponse(formId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: evaluationKeys.peer(sectionId, userId, formId),
      });
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      });
    },
  });
}
