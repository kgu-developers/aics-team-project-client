import type {
  AdminSectionEnrollmentsResponse,
  AdminTeamDetailDto,
} from '@aics/api-client';
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
    onSuccess: async (_enrollment, { sectionId, studentNumber }) => {
      queryClient.setQueryData<AdminSectionEnrollmentsResponse>(
        adminStudentTeamKeys.enrollments(sectionId),
        current =>
          current
            ? {
                ...current,
                contents: current.contents.map(enrollment =>
                  enrollment.studentNumber === studentNumber
                    ? { ...enrollment, status: 'WITHDRAWN' }
                    : enrollment,
                ),
              }
            : current,
      );
      queryClient.setQueriesData<AdminTeamDetailDto>(
        { queryKey: [...adminStudentTeamKeys.all, 'team'] },
        current =>
          current && String(current.sectionId) === String(sectionId)
            ? {
                ...current,
                members: current.members.filter(
                  member => member.studentNumber !== studentNumber,
                ),
              }
            : current,
      );
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
