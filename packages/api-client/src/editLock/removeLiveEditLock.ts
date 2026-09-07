import type { LiveEditLockTarget } from '@aics/core';

import { apiClient } from '../client';
import { assertLiveEditLockTarget } from './liveEditLockContract';
import { ENDPOINTS } from '../constants/endpoints';

/** Releases this account's lock, including one acquired in another tab. */
export async function removeLiveEditLock(
  target: LiveEditLockTarget,
): Promise<void> {
  assertLiveEditLockTarget(target);
  await apiClient.delete(ENDPOINTS.EDIT_LOCKS.ROOT, {
    params: { targetType: target.targetType, targetId: target.targetId },
  });
}
