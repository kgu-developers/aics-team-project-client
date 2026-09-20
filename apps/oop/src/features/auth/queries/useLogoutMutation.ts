import { submitLogout } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import { useAuthStore } from '../authStore';
import { broadcastLogout } from '../sessionSync';

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore(state => state.clearSession);

  return useMutation({
    mutationFn: async () => {
      try {
        return await submitLogout();
      } catch (error) {
        // An expired or already-cleared server session is already logged out.
        if (axios.isAxiosError(error) && error.response?.status === 401) return;
        throw error;
      }
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
      broadcastLogout();
    },
  });
}
