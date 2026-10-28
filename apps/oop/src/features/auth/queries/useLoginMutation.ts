import {
  submitLogin,
  getSessionSnapshot,
  assertSessionFinalizationCurrent,
} from '@aics/api-client';
import type { AuthLoginInput, CurrentUser } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isCancel } from 'axios';

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
        const snapshot = getSessionSnapshot();
        const currentUser = await fetchSessionUser(role);
        assertSessionFinalizationCurrent(snapshot);
        session.setCurrentUser(currentUser);
        session.markAuthenticated(role);
        return currentUser;
      } catch (error) {
        if (
          !isCancel(error) &&
          useAuthStore.getState().sessionEndReason === null
        ) {
          session.clearSession();
        }
        throw error;
      }
    },
    onSuccess: currentUser =>
      queryClient.setQueryData(authKeys.currentUser(), currentUser),
  });
}
export type LoginInput = AuthLoginInput;
