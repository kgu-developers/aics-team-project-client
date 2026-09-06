import {
  submitAdminSectionMilestone,
  updateAdminSectionMilestoneStatus,
  type AdminMilestoneCreateInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export type SubmitAdminSectionMilestonesInput = {
  sections: readonly {
    input: AdminMilestoneCreateInput;
    publish: boolean;
    sectionId: string;
  }[];
};

export type SubmitAdminSectionMilestonesResult = {
  milestoneId?: number;
  sectionId: string;
  status: 'created' | 'create-failed' | 'publish-failed' | 'published';
};

export function useSubmitAdminSectionMilestonesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sections }: SubmitAdminSectionMilestonesInput) =>
      Promise.all(
        sections.map(async ({ input, publish, sectionId }) => {
          try {
            const { id } = await submitAdminSectionMilestone(sectionId, input);
            if (!publish) {
              return { milestoneId: id, sectionId, status: 'created' } as const;
            }

            try {
              await updateAdminSectionMilestoneStatus(
                sectionId,
                String(id),
                'PUBLISHED',
              );
              return {
                milestoneId: id,
                sectionId,
                status: 'published',
              } as const;
            } catch {
              return {
                milestoneId: id,
                sectionId,
                status: 'publish-failed',
              } as const;
            }
          } catch {
            return { sectionId, status: 'create-failed' } as const;
          }
        }),
      ),
    onSuccess: async results => {
      await Promise.all(
        results
          .filter(result => result.status !== 'create-failed')
          .map(result =>
            queryClient.invalidateQueries({
              queryKey: adminSectionMilestoneKeys.list(result.sectionId),
            }),
          ),
      );
    },
  });
}
