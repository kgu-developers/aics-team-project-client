import { completeAdminMidReportFeedback } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMidReportKeys } from './adminMidReportKeys';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useCompleteAdminMidReportFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      sectionId,
      teamId,
      version,
    }: {
      sectionId: string;
      teamId: string;
      version: number;
    }) => completeAdminMidReportFeedback(sectionId, teamId, version),
    onSuccess: async (report, { sectionId, teamId }) => {
      queryClient.setQueryData(
        adminMidReportKeys.detail(sectionId, teamId),
        report,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [...adminMidReportKeys.all, 'feedbacks'],
        }),
        queryClient.invalidateQueries({
          queryKey: adminMilestoneSubmissionsKeys.all,
        }),
      ]);
    },
    onError: async (_error, { sectionId, teamId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminMidReportKeys.detail(sectionId, teamId),
      });
    },
  });
}
