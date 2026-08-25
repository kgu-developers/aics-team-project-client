import type { EditLockAcquireInput, EditLockStatus } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function acquireEditLock(
  input: EditLockAcquireInput,
): Promise<EditLockStatus> {
  const response = await apiClient.post<EditLockStatus>(
    ENDPOINTS.EDIT_LOCKS.ROOT,
    input,
  );
  return response.data;
}
