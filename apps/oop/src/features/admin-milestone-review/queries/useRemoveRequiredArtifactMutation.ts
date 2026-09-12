import { removeRequiredArtifact } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminRequiredArtifactKeys } from './adminRequiredArtifactKeys';

export function useRemoveRequiredArtifactMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      requiredArtifactId,
      sectionId,
    }: {
      milestoneId: string;
      requiredArtifactId: string;
      sectionId: string;
    }) => removeRequiredArtifact(sectionId, milestoneId, requiredArtifactId),
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
