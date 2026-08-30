import { submitMidReportFeedback } from '@aics/api-client';
import type { SubmitMidReportFeedbackInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

export type SubmitMidReportFeedbackVariables = SubmitMidReportFeedbackInput & {
  submissionId: string;
};

export function useSubmitMidReportFeedbackMutation(sectionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      ...input
    }: SubmitMidReportFeedbackVariables) =>
      submitMidReportFeedback(submissionId, input),
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      }),
  });
}
