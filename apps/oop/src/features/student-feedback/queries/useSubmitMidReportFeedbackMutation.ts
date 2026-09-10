import type { SubmitMidReportFeedbackInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teamMessageMutationOptions } from '~/features/team-message/queries';

export type SubmitMidReportFeedbackVariables = SubmitMidReportFeedbackInput;

export function useSubmitMidReportFeedbackMutation(teamId?: string) {
  const queryClient = useQueryClient();
  const options = teamMessageMutationOptions(queryClient, teamId);
  return useMutation({
    ...options,
    mutationFn: (input: SubmitMidReportFeedbackVariables) =>
      options.mutationFn({
        message: input.content.trim(),
        relatedType: 'MID_REPORT',
      }),
  });
}
