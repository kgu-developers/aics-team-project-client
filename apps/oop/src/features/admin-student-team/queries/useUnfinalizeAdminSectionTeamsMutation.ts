import { unfinalizeAdminSectionTeams } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminTeamDashboardKeys } from '~/features/admin-team-dashboard/queries/adminTeamDashboardKeys';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type UnfinalizeAdminSectionTeamsVariables = {
  reason: string;
  sectionId: string;
};

export function useUnfinalizeAdminSectionTeamsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reason, sectionId }: UnfinalizeAdminSectionTeamsVariables) =>
      unfinalizeAdminSectionTeams(sectionId, { reason }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminStudentTeamKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminTeamDashboardKeys.all }),
      ]);
    },
  });
}
