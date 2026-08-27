import {
  updateAdminPresentationEvaluationSettings,
  type UpdateAdminPresentationEvaluationSettingsInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminTeamDashboardKeys } from '~/features/admin-team-dashboard/queries/adminTeamDashboardKeys';

import { adminMilestoneScheduleKeys } from './adminMilestoneScheduleKeys';
import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';

export function useUpdateAdminPresentationEvaluationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAdminPresentationEvaluationSettingsInput) =>
      updateAdminPresentationEvaluationSettings(input),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminPresentationEvaluationKeys.list(variables.sectionId),
        }),
        queryClient.invalidateQueries({
          queryKey: adminMilestoneScheduleKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: adminTeamDashboardKeys.all,
        }),
      ]);
    },
  });
}
