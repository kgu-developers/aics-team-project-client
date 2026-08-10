import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitLogout(): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
}
