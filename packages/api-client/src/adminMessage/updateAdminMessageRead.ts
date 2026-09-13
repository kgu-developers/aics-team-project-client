import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateAdminMessageRead(messageId: number | string) {
  await apiClient.patch(ENDPOINTS.ADMIN_MESSAGE.READ(messageId));
}
