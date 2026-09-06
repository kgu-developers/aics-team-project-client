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
    mutationFn: ({ sectionId, ...input }: Input) => {
      // sectionId is used for cache invalidation, not sent to the API.
      void sectionId;
      return updatePresentationOrder(input);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: adminPresentationEvaluationKeys.list(variables.sectionId),
      });
    },
  });
}
