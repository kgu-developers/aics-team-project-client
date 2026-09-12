import {
  submitRequiredArtifact,
  type RequiredArtifactInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminRequiredArtifactKeys } from './adminRequiredArtifactKeys';

export function useSubmitRequiredArtifactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      milestoneId,
      sectionId,
    }: {
      input: RequiredArtifactInput;
      milestoneId: string;
      sectionId: string;
    }) => submitRequiredArtifact(sectionId, milestoneId, input),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: adminRequiredArtifactKeys.list(
          variables.sectionId,
          variables.milestoneId,
        ),
      });
    },
  });
}
