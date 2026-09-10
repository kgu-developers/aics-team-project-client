import { fetchLiveEditLock, submitLiveEditLock } from '@aics/api-client';
import type { LiveEditLockTarget } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useAuthStore } from '~/features/auth/authStore';

import { liveEditLockKeys } from './liveEditLockKeys';
import {
  cacheLiveEditLockStatus,
  cancelLiveEditLockQuery,
  createLiveEditLockRequest,
} from './liveEditLockRequest';

/** POST acquires a lock or renews the current account's existing lock. */
export function useAcquireLiveEditLockMutation() {
  const session = useAuthStore();
  const client = useQueryClient();
  return useMutation({
    mutationKey: [...liveEditLockKeys.all, 'acquire'],
    retry: false,
    mutationFn: async (target: LiveEditLockTarget) => {
      const request = createLiveEditLockRequest(session, target);
      await cancelLiveEditLockQuery(client, request);
      try {
        const status = await submitLiveEditLock(request.target);
        await cacheLiveEditLockStatus(client, request, status);
        return status;
      } catch (error) {
        request.assertCurrentSession();
        if (isAxiosError(error) && error.response?.status === 409) {
          // The 409 body only contains a code. Keep the mutation rejected while
          // refreshing the query so consumers can show the current editor.
          try {
            const status = await fetchLiveEditLock(request.target);
            await cacheLiveEditLockStatus(client, request, status);
          } catch {
            // Do not keep a previously owned/unlocked status fresh on failure.
            request.assertCurrentSession();
            await client.invalidateQueries({
              queryKey: request.queryKey,
              exact: true,
              refetchType: 'none',
            });
          }
        }
        throw error;
      }
    },
  });
}
