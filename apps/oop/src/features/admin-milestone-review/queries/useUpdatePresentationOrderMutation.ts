import {
  updatePresentationOrder,
  type UpdatePresentationOrderInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';

type Input = UpdatePresentationOrderInput & { sectionId: string };

export function useUpdatePresentationOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId: _sectionId, ...input }: Input) =>
      updatePresentationOrder(input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: adminPresentationEvaluationKeys.list(variables.sectionId),
      });
    },
  });
}
