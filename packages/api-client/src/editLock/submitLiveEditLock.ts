import type { LiveEditLockTarget, LiveEditLockStatus } from '@aics/core';

import { apiClient } from '../client';
import {
  assertLiveEditLockTarget,
  mapLiveEditLockStatus,
} from './liveEditLockContract';
import { ENDPOINTS } from '../constants/endpoints';

/** Account-scoped acquire/renew. No lease or tab ownership is returned. */
export async function submitLiveEditLock(
  target: LiveEditLockTarget,
): Promise<LiveEditLockStatus> {
  assertLiveEditLockTarget(target);
  const response = await apiClient.post<unknown>(ENDPOINTS.EDIT_LOCKS.ROOT, {
    targetType: target.targetType,
    targetId: target.targetId,
    sectionKey: target.sectionKey,
  });
  return mapLiveEditLockStatus(response.data);
}
