import { submitLogout } from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../authStore';

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore(state => state.clearSession);

  return useMutation({
    mutationFn: submitLogout,
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
