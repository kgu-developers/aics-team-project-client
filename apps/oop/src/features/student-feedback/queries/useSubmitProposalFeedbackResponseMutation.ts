import type { SubmitProposalFeedbackResponseInput } from '@aics/core';

import { useSubmitTeamMessageMutation } from '~/features/team-message/queries';

export type SubmitProposalFeedbackResponseVariables =
  SubmitProposalFeedbackResponseInput;

export function useSubmitProposalFeedbackResponseMutation(teamId?: string) {
  const mutation = useSubmitTeamMessageMutation(teamId);
  const toMessage = (input: SubmitProposalFeedbackResponseVariables) => ({
    message: input.content.trim(),
    relatedType: 'PROPOSAL' as const,
  });

  return {
    ...mutation,
    mutate: (
      input: SubmitProposalFeedbackResponseVariables,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate(toMessage(input), options),
    mutateAsync: (
      input: SubmitProposalFeedbackResponseVariables,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync(toMessage(input), options),
  };
}
