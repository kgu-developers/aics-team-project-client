import type { EditLockReleaseInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeEditLock(
  input: EditLockReleaseInput,
): Promise<void> {
  await apiClient.delete(ENDPOINTS.EDIT_LOCKS.ROOT, { params: input });
}
