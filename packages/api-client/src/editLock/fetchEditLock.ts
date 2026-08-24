import type { EditLockStatus, EditLockTarget } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchEditLock(
  input: EditLockTarget,
): Promise<EditLockStatus> {
  const response = await apiClient.get<EditLockStatus>(
    ENDPOINTS.EDIT_LOCKS.ROOT,
    {
      params: input,
    },
  );
  return response.data;
}
