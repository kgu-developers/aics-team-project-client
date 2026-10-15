import { removeAdminSectionMilestone } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminMilestoneScheduleKeys } from './adminMilestoneScheduleKeys';
import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

type RemoveAdminSectionMilestoneInput = {
  milestoneId: string;
  sectionId: string;
};

export function useRemoveAdminSectionMilestoneMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, RemoveAdminSectionMilestoneInput>({
    mutationFn: ({ milestoneId, sectionId }) =>
      removeAdminSectionMilestone(sectionId, milestoneId),
    onSuccess: async (_, { milestoneId, sectionId }) => {
      queryClient.removeQueries({
        queryKey: adminSectionMilestoneKeys.detail(sectionId, milestoneId),
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminSectionMilestoneKeys.list(sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminMilestoneScheduleKeys.all,
        }),
      ]);
    },
  });
}
