import { updateAdminUser, type UpdateAdminUserInput } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type Variables = {
  input: UpdateAdminUserInput;
  studentNumber: string;
};

export function useUpdateAdminAssistantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, studentNumber }: Variables) =>
      updateAdminUser(studentNumber, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
