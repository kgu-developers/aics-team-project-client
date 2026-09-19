import {
  updateAdminSectionMilestoneEvaluationWindow,
  type AdminMilestoneEvaluationWindowInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export type UpdateAdminSectionMilestoneEvaluationWindowInput = {
  input: AdminMilestoneEvaluationWindowInput;
  milestoneId: string;
  sectionId: string;
};

/** PRESENTATION 발표 평가 기간만 바꾼다. 나머지 일정은 다시 보내지 않는다. */
export function useUpdateAdminSectionMilestoneEvaluationWindowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      milestoneId,
      sectionId,
    }: UpdateAdminSectionMilestoneEvaluationWindowInput) =>
      updateAdminSectionMilestoneEvaluationWindow(sectionId, milestoneId, input),
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
      ]);
    },
  });
}
