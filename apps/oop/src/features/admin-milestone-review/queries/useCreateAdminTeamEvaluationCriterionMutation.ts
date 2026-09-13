import {
  createAdminTeamEvaluationCriterion,
  type AdminTeamEvaluationCriterionCreateInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminTeamEvaluationCriteriaKeys } from './adminTeamEvaluationCriteriaKeys';

type CreateAdminTeamEvaluationCriterionVariables = {
  input: AdminTeamEvaluationCriterionCreateInput;
  sectionId: string;
};

export function useCreateAdminTeamEvaluationCriterionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      sectionId,
    }: CreateAdminTeamEvaluationCriterionVariables) =>
      createAdminTeamEvaluationCriterion(sectionId, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: adminTeamEvaluationCriteriaKeys.list(variables.sectionId),
      });
    },
  });
}
