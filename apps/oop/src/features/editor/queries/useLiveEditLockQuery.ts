import { fetchLiveEditLock } from '@aics/api-client';
import type { LiveEditLockTarget } from '@aics/core';
import { skipToken, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { liveEditLockKeys } from './liveEditLockKeys';
import { canRequestLiveEditLock } from './liveEditLockRequest';

export function useLiveEditLockQuery(
  target: LiveEditLockTarget | null | undefined,
) {
  const session = useAuthStore();
  return useQuery({
    queryKey: liveEditLockKeys.detail(session, target),
    queryFn: canRequestLiveEditLock(session, target)
      ? () => fetchLiveEditLock(target)
      : skipToken,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
