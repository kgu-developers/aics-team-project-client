import {
  updateAdminProfessorPresentationEvaluation,
  type AdminProfessorPresentationEvaluationInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminPresentationProgressKeys } from './adminPresentationProgressKeys';

type Variables = AdminProfessorPresentationEvaluationInput & {
  milestoneId: string;
  sectionId: string;
  teamId: string;
};

export function useUpdateAdminProfessorPresentationEvaluationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, milestoneId, teamId, ...input }: Variables) =>
      updateAdminProfessorPresentationEvaluation(
        sectionId,
        milestoneId,
        teamId,
        input,
      ),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: adminPresentationProgressKeys.professorEvaluation(
          variables.sectionId,
          variables.milestoneId,
          variables.teamId,
        ),
      });
    },
  });
}
