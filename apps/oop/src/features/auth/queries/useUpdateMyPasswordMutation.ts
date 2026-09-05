import { updateUserPassword } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { selectHasAuthenticatedSession, useAuthStore } from '../authStore';

export type UpdateMyPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export function useUpdateMyPasswordMutation({
  onSuccess,
}: { onSuccess?: () => void } = {}) {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore(state => state.clearSession);

  return useMutation<string, unknown, UpdateMyPasswordInput>({
    mutationFn: input => {
      const session = useAuthStore.getState();
      const currentUser = session.currentUser;
      if (
        !selectHasAuthenticatedSession(session) ||
        !currentUser?.studentNumber.trim()
      ) {
        throw new Error('비밀번호를 변경하려면 현재 사용자 정보가 필요합니다.');
      }

      return updateUserPassword({
        studentNumber: currentUser.studentNumber,
        currentPassword: input.currentPassword,
        password: input.newPassword,
      });
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
      // The session guard unmounts the form, which can drop mutate-level callbacks.
      onSuccess?.();
    },
  });
}
