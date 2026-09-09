import { applyAdminTeamImport } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminRosterImportStatusKeys } from './adminRosterImportStatusKeys';
import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useApplyAdminTeamImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyAdminTeamImport,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminStudentTeamKeys.all }),
        queryClient.invalidateQueries({
          queryKey: adminRosterImportStatusKeys.all,
        }),
      ]);
    },
  });
}
