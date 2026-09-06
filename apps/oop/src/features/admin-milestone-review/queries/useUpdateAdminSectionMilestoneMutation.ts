import {
  updateAdminSectionMilestone,
  updateAdminSectionMilestoneStatus,
  updateAdminSectionMilestoneWeekNumbers,
  type AdminMilestoneStatus,
  type AdminMilestoneUpdateInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export type UpdateAdminSectionMilestoneInput = {
  currentStatus: AdminMilestoneStatus;
  input: AdminMilestoneUpdateInput;
  milestoneId: string;
  currentWeekNumber: number;
  sectionId: string;
  status: AdminMilestoneStatus;
  weekNumber: number;
};

export type UpdateAdminSectionMilestoneResult = {
  statusUpdated: boolean;
  weekNumberUpdated: boolean;
};

export function useUpdateAdminSectionMilestoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentStatus,
      currentWeekNumber,
      input,
      milestoneId,
      sectionId,
      status,
      weekNumber,
    }: UpdateAdminSectionMilestoneInput): Promise<UpdateAdminSectionMilestoneResult> => {
      await updateAdminSectionMilestone(sectionId, milestoneId, input);

      let weekNumberUpdated = true;
      if (currentWeekNumber !== weekNumber) {
        try {
          await updateAdminSectionMilestoneWeekNumbers(sectionId, {
            changes: [{ milestoneId: Number(milestoneId), weekNumber }],
          });
        } catch {
          weekNumberUpdated = false;
        }
      }

      let statusUpdated = true;
      if (currentStatus !== status) {
        try {
          await updateAdminSectionMilestoneStatus(
            sectionId,
            milestoneId,
            status,
          );
        } catch {
          statusUpdated = false;
        }
      }

      return { statusUpdated, weekNumberUpdated };
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
