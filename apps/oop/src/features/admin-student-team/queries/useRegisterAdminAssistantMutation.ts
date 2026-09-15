import {
  fetchAdminUser,
  submitAdminSectionEnrollment,
  submitAdminUser,
  type SubmitAdminUserInput,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { adminStudentTeamKeys } from './adminStudentTeamKeys';

type Variables = {
  sectionId: string;
  user: SubmitAdminUserInput;
};

export function useRegisterAdminAssistantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, user }: Variables) => {
      try {
        await fetchAdminUser(user.studentNumber);
      } catch (error) {
        if (!isAxiosError(error) || error.response?.status !== 404) throw error;
        await submitAdminUser(user);
      }

      return submitAdminSectionEnrollment(sectionId, {
        role: 'ASSISTANT',
        studentNumber: user.studentNumber,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminStudentTeamKeys.all,
      });
    },
  });
}
