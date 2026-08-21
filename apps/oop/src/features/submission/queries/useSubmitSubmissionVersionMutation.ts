import { submitSubmissionVersion } from '@aics/api-client';
import type { SubmitSubmissionVersionInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { submissionKeys } from './submissionKeys';

export function useSubmitSubmissionVersionMutation(
  sectionId: string,
  userId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      input,
    }: {
      submissionId: string;
      input: SubmitSubmissionVersionInput;
    }) => submitSubmissionVersion(submissionId, input),
    onSuccess: submission => {
      queryClient.setQueryData(
        submissionKeys.detail(sectionId, userId, submission.id),
        submission,
      );
      queryClient.setQueryData(
        submissionKeys.byMilestone(
          sectionId,
          userId,
          submission.milestoneId,
        ),
        submission,
      );
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      });
    },
  });
}
