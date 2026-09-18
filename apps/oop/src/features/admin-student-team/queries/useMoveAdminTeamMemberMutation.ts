import { updateAdminTeamMember } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type Variables = {
  isLeader?: boolean;
  studentNumber: string;
  targetTeamId: number;
  teamId: number;
};

export function useMoveAdminTeamMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      isLeader,
      studentNumber,
      targetTeamId,
      teamId,
    }: Variables) =>
      updateAdminTeamMember(teamId, studentNumber, {
        ...(isLeader === undefined ? {} : { isLeader }),
        targetTeamId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
