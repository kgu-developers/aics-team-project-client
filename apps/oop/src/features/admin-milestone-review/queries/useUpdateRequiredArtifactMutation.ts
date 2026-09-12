import {
  updateRequiredArtifact,
  type RequiredArtifactInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminRequiredArtifactKeys } from './adminRequiredArtifactKeys';

export function useUpdateRequiredArtifactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      milestoneId,
      requiredArtifactId,
      sectionId,
    }: {
      input: RequiredArtifactInput;
      milestoneId: string;
      requiredArtifactId: string;
      sectionId: string;
    }) =>
      updateRequiredArtifact(sectionId, milestoneId, requiredArtifactId, input),
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
