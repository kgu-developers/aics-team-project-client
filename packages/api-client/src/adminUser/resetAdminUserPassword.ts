import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function resetAdminUserPassword(
  studentNumber: string,
): Promise<void> {
  await apiClient.patch(ENDPOINTS.ADMIN.USER_PASSWORD_RESET(studentNumber));
}
