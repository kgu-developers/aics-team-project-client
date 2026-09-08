import { updateAdminSectionEnrollment } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type Variables = {
  sectionId: string;
  studentNumber: string;
};

export function useWithdrawAdminSectionEnrollmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionId, studentNumber }: Variables) =>
      updateAdminSectionEnrollment(sectionId, studentNumber, {
        status: 'WITHDRAWN',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
