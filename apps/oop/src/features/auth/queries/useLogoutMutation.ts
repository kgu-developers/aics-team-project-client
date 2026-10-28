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
        const { generation } = await submitLogout({ withCommit: true });
        return { generation };
      } catch (error) {
        // An expired or already-cleared server session permits local idempotent
        // cleanup, but it is not a confirmed cookie-session commit to publish.
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return { generation: null };
        }
        throw error;
      }
    },
    onSuccess: ({ generation }) => {
      clearSession();
      queryClient.clear();
      if (generation) broadcastLogout(generation);
    },
  });
}
