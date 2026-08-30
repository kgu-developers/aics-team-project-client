import { submitProposalFeedbackResponse } from '@aics/api-client';
import type { SubmitProposalFeedbackResponseInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

export type SubmitProposalFeedbackResponseVariables =
  SubmitProposalFeedbackResponseInput & {
    reviewId: string;
  };

export function useSubmitProposalFeedbackResponseMutation(sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      ...input
    }: SubmitProposalFeedbackResponseVariables) =>
      submitProposalFeedbackResponse(reviewId, input),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      }),
  });
}
