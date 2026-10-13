import { finalizeAdminSectionTeams } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminTeamDashboardKeys } from '~/features/admin-team-dashboard/queries/adminTeamDashboardKeys';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useFinalizeAdminSectionTeamsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: finalizeAdminSectionTeams,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminStudentTeamKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminTeamDashboardKeys.all }),
      ]);
    },
  });
}
