import { applyAdminTeamImport } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useApplyAdminTeamImportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: applyAdminTeamImport,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminStudentTeamKeys.all }),
  });
}
