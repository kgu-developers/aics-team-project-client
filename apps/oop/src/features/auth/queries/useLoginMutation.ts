import { submitLogin } from '@aics/api-client';
import type { AuthLoginInput, CurrentUser } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../authStore';
import { fetchSessionUser } from '../fetchSessionUser';
import { requireSessionRole } from '../requireSessionRole';
import { authKeys } from './authKeys';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation<CurrentUser, unknown, AuthLoginInput>({
    mutationFn: async input => {
      const session = useAuthStore.getState();
      session.clearSession();
      queryClient.clear();
      try {
        const role = requireSessionRole(await submitLogin(input));
        const currentUser = await fetchSessionUser(role);
        session.setCurrentUser(currentUser);
        session.markAuthenticated(role);
        return currentUser;
      } catch (error) {
        session.clearSession();
        throw error;
      }
    },
    onSuccess: currentUser =>
      queryClient.setQueryData(authKeys.currentUser(), currentUser),
  });
}
export type LoginInput = AuthLoginInput;
