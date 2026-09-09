import { applyAdminEnrollmentImport } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminRosterImportStatusKeys } from './adminRosterImportStatusKeys';
import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useApplyAdminEnrollmentImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyAdminEnrollmentImport,
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
