import {
  submitAdminProposalFeedback,
  type SubmitAdminProposalFeedbackInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';
import { adminProposalFeedbackKeys } from './adminProposalFeedbackKeys';

type Variables = {
  input: SubmitAdminProposalFeedbackInput;
  sectionId: string;
  teamId: string;
};

export function useSubmitAdminProposalFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, sectionId, teamId }: Variables) =>
      submitAdminProposalFeedback(sectionId, teamId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminProposalFeedbackKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: adminMilestoneSubmissionsKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ['admin-project-proposal'],
        }),
      ]);
    },
  });
}
