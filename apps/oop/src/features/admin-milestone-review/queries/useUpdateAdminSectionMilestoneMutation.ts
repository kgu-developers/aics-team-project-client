import {
  updateAdminSectionMilestone,
  updateAdminSectionMilestoneStatus,
  type AdminMilestoneStatus,
  type AdminMilestoneUpdateInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export type UpdateAdminSectionMilestoneInput = {
  currentStatus: AdminMilestoneStatus;
  input: AdminMilestoneUpdateInput;
  milestoneId: string;
  sectionId: string;
  status: AdminMilestoneStatus;
};

export type UpdateAdminSectionMilestoneResult = {
  statusUpdated: boolean;
};

export function useUpdateAdminSectionMilestoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentStatus,
      input,
      milestoneId,
      sectionId,
      status,
    }: UpdateAdminSectionMilestoneInput): Promise<UpdateAdminSectionMilestoneResult> => {
      await updateAdminSectionMilestone(sectionId, milestoneId, input);

      if (currentStatus === status) return { statusUpdated: true };

      try {
        await updateAdminSectionMilestoneStatus(sectionId, milestoneId, status);
        return { statusUpdated: true };
      } catch {
        return { statusUpdated: false };
      }
    },
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
