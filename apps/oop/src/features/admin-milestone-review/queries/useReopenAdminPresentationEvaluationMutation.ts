import {
  reopenAdminPresentationEvaluation,
  type ReopenAdminPresentationEvaluationInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';
import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

type Variables = ReopenAdminPresentationEvaluationInput & {
  milestoneId: string;
  sectionId: string;
};

export function useReopenAdminPresentationEvaluationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, milestoneId, ...input }: Variables) =>
      reopenAdminPresentationEvaluation(sectionId, milestoneId, input),
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
