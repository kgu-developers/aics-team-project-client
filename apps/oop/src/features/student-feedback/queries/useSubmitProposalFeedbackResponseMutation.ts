import type { SubmitProposalFeedbackResponseInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamMessageMutationOptions } from '~/features/team-message/queries';

export type SubmitProposalFeedbackResponseVariables =
  SubmitProposalFeedbackResponseInput;

export function useSubmitProposalFeedbackResponseMutation(teamId?: string) {
  const queryClient = useQueryClient();
  const options = teamMessageMutationOptions(queryClient, teamId);
  return useMutation({
    ...options,
    mutationFn: (input: SubmitProposalFeedbackResponseVariables) =>
      options.mutationFn({
        message: input.content.trim(),
        relatedType: 'PROPOSAL',
      }),
  });
}
