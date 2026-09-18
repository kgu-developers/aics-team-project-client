import { updateAdminTeamMember } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type Variables = {
  projectRole: string;
  studentNumber: string;
  teamId: number;
};

export function useUpdateAdminTeamMemberRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectRole, studentNumber, teamId }: Variables) =>
      updateAdminTeamMember(teamId, studentNumber, { projectRole }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
