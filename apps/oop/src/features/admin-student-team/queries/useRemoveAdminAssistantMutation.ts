import { removeAdminUser } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useRemoveAdminAssistantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAdminUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
