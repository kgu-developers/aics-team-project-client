import { closeAdminPresentationEvaluation } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';
import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

type Variables = { milestoneId: string; sectionId: string };

export function useCloseAdminPresentationEvaluationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, milestoneId }: Variables) =>
      closeAdminPresentationEvaluation(sectionId, milestoneId),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminSectionMilestoneKeys.detail(
            variables.sectionId,
            variables.milestoneId,
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: adminSectionMilestoneKeys.list(variables.sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminPresentationProgressKeys.all,
        }),
      ]);
    },
  });
}
