import {
  updateAdminSectionMilestoneStatus,
  type AdminMilestoneStatus,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

type UpdateAdminSectionMilestoneStatusInput = {
  milestoneId: string;
  sectionId: string;
  status: Extract<AdminMilestoneStatus, 'DRAFT' | 'PUBLISHED'>;
};

export function useUpdateAdminSectionMilestoneStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      sectionId,
      status,
    }: UpdateAdminSectionMilestoneStatusInput) =>
      updateAdminSectionMilestoneStatus(sectionId, milestoneId, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminSectionMilestoneKeys.list(variables.sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminSectionMilestoneKeys.detail(
            variables.sectionId,
            variables.milestoneId,
          ),
        }),
      ]);
    },
  });
}
