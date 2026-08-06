import { fetchCurrentUser, submitLogin } from '@aics/api-client';
import type { AuthLoginInput, CurrentUser } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../authStore';
import { authKeys } from './authKeys';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setAccessToken = useAuthStore(state => state.setAccessToken);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const clearSession = useAuthStore(state => state.clearSession);

  return useMutation<CurrentUser, unknown, AuthLoginInput>({
    mutationFn: async input => {
      const response = await submitLogin(input);
      setAccessToken(response.accessToken);

      try {
        const currentUser = await fetchCurrentUser();
        setCurrentUser(currentUser);

        return currentUser;
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    onSuccess: currentUser => {
      queryClient.setQueryData(authKeys.currentUser(), currentUser);
    },
  });
}

export type LoginInput = AuthLoginInput;
