import { finalizeAdminSectionTeams } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useFinalizeAdminSectionTeamsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: finalizeAdminSectionTeams,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminStudentTeamKeys.all }),
  });
}
