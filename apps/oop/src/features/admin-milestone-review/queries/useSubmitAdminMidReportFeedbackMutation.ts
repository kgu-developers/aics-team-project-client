import {
  submitAdminMidReportFeedback,
  type SubmitAdminMidReportFeedbackInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMidReportKeys } from './adminMidReportKeys';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

type Variables = {
  input: SubmitAdminMidReportFeedbackInput;
  sectionId: string;
  teamId: string;
};

export function useSubmitAdminMidReportFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, sectionId, teamId }: Variables) =>
      submitAdminMidReportFeedback(sectionId, teamId, input),
    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminMidReportKeys.detail(
            variables.sectionId,
            variables.teamId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: [...adminMidReportKeys.all, 'feedbacks'],
        }),
        queryClient.invalidateQueries({
          queryKey: adminMilestoneSubmissionsKeys.all,
        }),
      ]);
    },
  });
}
