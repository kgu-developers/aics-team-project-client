import { resetAdminUserPassword } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

export function useResetAdminUserPasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentNumber: string) =>
      resetAdminUserPassword(studentNumber),
    onSuccess: async (_, studentNumber) => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.user(studentNumber),
      });
    },
  });
}
