import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeAdminUser(studentNumber: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.ADMIN.USER(studentNumber));
}
