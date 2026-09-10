import { removeLiveEditLock } from '@aics/api-client';
import type { LiveEditLockTarget } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { liveEditLockKeys } from './liveEditLockKeys';
import {
  cancelLiveEditLockQuery,
  createLiveEditLockRequest,
} from './liveEditLockRequest';

/** DELETE returns 204; reread active queries instead of assuming unlocked. */
export function useReleaseLiveEditLockMutation() {
  const session = useAuthStore();
  const client = useQueryClient();
  return useMutation({
    mutationKey: [...liveEditLockKeys.all, 'release'],
    retry: false,
    mutationFn: async (target: LiveEditLockTarget) => {
      const request = createLiveEditLockRequest(session, target);
      await cancelLiveEditLockQuery(client, request);
      await removeLiveEditLock(request.target);
      await cancelLiveEditLockQuery(client, request);
      await client.invalidateQueries({
        queryKey: request.queryKey,
        exact: true,
      });
    },
  });
}
