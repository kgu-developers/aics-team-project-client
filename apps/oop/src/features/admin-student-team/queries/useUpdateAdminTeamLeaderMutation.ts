import { updateAdminTeamMember } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type Variables = {
  studentNumber: string;
  teamId: number;
};

export function useUpdateAdminTeamLeaderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentNumber, teamId }: Variables) =>
      updateAdminTeamMember(teamId, studentNumber, { isLeader: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
