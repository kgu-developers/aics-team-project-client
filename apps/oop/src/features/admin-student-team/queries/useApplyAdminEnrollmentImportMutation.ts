import { applyAdminEnrollmentImport } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useApplyAdminEnrollmentImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyAdminEnrollmentImport,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminStudentTeamKeys.all }),
  });
}
