import { apiClient } from '../client';

export async function submitLogout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
