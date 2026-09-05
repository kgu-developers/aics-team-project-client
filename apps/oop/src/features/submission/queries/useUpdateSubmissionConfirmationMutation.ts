import {
  confirmSubmission,
  withdrawSubmissionConfirmation,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { submissionKeys } from './submissionKeys';

export function useUpdateSubmissionConfirmationMutation(
  sectionId: string,
  userId: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      confirmed,
    }: {
      submissionId: string;
      confirmed: boolean;
    }) =>
      confirmed
        ? confirmSubmission(submissionId)
        : withdrawSubmissionConfirmation(submissionId),
    onSuccess: submission => {
      queryClient.setQueryData(
        submissionKeys.detail(sectionId, userId, submission.id),
        submission,
      );
      queryClient.setQueryData(
        submissionKeys.byMilestone(sectionId, userId, submission.milestoneId),
        submission,
      );
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboard(sectionId),
      });
    },
  });
}
