import {
  updateAdminTeamEvaluationCriterion,
  type AdminTeamEvaluationCriterionUpdateInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminEvaluationKeys } from '~/features/admin-evaluation/queries/adminEvaluationKeys';

import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';
import { adminTeamEvaluationCriteriaKeys } from './adminTeamEvaluationCriteriaKeys';

type Variables = AdminTeamEvaluationCriterionUpdateInput & {
  criterionId: number;
  sectionId: string;
};

export function useUpdateAdminTeamEvaluationCriterionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ criterionId, sectionId, ...input }: Variables) =>
      updateAdminTeamEvaluationCriterion(sectionId, criterionId, input),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminTeamEvaluationCriteriaKeys.list(variables.sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminPresentationEvaluationKeys.list(variables.sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminEvaluationKeys.presentationEvaluation.lists(
            variables.sectionId,
          ),
        }),
      ]);
    },
  });
}
