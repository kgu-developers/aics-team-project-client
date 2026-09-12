import {
  submitRequiredArtifact,
  type RequiredArtifactInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminRequiredArtifactKeys } from './adminRequiredArtifactKeys';

export type SubmitAdminRequiredArtifactsResult = {
  createdCount: number;
  failedCount: number;
  milestoneId: string;
  sectionId: string;
};

export function useSubmitAdminRequiredArtifactsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissions,
    }: {
      submissions: readonly {
        artifacts: readonly RequiredArtifactInput[];
        milestoneId: string;
        sectionId: string;
      }[];
    }): Promise<SubmitAdminRequiredArtifactsResult[]> =>
      Promise.all(
        submissions.map(async ({ artifacts, milestoneId, sectionId }) => {
          const results = await Promise.allSettled(
            artifacts.map(artifact =>
              submitRequiredArtifact(sectionId, milestoneId, artifact),
            ),
          );

          return {
            createdCount: results.filter(
              result => result.status === 'fulfilled',
            ).length,
            failedCount: results.filter(result => result.status === 'rejected')
              .length,
            milestoneId,
            sectionId,
          };
        }),
      ),
    onSuccess: async results => {
      await Promise.all(
        results.map(result =>
          queryClient.invalidateQueries({
            queryKey: adminRequiredArtifactKeys.list(
              result.sectionId,
              result.milestoneId,
            ),
          }),
        ),
      );
    },
  });
}
