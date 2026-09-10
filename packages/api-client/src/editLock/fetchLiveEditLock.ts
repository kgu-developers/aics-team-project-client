import type { LiveEditLockTarget, LiveEditLockStatus } from '@aics/core';

import { apiClient } from '../client';
import {
  assertLiveEditLockTarget,
  mapLiveEditLockStatus,
} from './liveEditLockContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchLiveEditLock(
  target: LiveEditLockTarget,
): Promise<LiveEditLockStatus> {
  assertLiveEditLockTarget(target);
  const response = await apiClient.get<unknown>(ENDPOINTS.EDIT_LOCKS.ROOT, {
    params: {
      targetType: target.targetType,
      targetId: target.targetId,
      sectionKey: target.sectionKey,
    },
  });
  return mapLiveEditLockStatus(response.data);
}
