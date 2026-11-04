import {
  submitAdminProposalFeedback,
  type SubmitAdminProposalFeedbackInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMessageKeys } from '~/features/admin-message/queries/adminMessageKeys';
import { teamMessageKeys } from '~/features/team-message/queries/teamMessageKeys';

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
    onSuccess: async (_response, variables) => {
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
        queryClient.invalidateQueries({
          queryKey: teamMessageKeys.team(variables.teamId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminMessageKeys.all,
        }),
      ]);
    },
  });
}
