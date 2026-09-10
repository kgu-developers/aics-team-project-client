import type { SubmitMidReportFeedbackInput } from '@aics/core';

import { useSubmitTeamMessageMutation } from '~/features/team-message/queries';

export type SubmitMidReportFeedbackVariables = SubmitMidReportFeedbackInput;

export function useSubmitMidReportFeedbackMutation(teamId?: string) {
  const mutation = useSubmitTeamMessageMutation(teamId);
  const toMessage = (input: SubmitMidReportFeedbackVariables) => ({
    message: input.content.trim(),
    relatedType: 'MID_REPORT' as const,
  });

  return {
    ...mutation,
    mutate: (
      input: SubmitMidReportFeedbackVariables,
      options?: Parameters<typeof mutation.mutate>[1],
    ) => mutation.mutate(toMessage(input), options),
    mutateAsync: (
      input: SubmitMidReportFeedbackVariables,
      options?: Parameters<typeof mutation.mutateAsync>[1],
    ) => mutation.mutateAsync(toMessage(input), options),
  };
}
