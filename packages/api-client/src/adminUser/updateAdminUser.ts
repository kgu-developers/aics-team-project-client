import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type UpdateAdminUserInput = {
  email: string;
  globalRole: 'ADMIN' | 'USER';
  name: string;
  password?: string;
  phone: string;
};

export async function updateAdminUser(
  studentNumber: string,
  input: UpdateAdminUserInput,
): Promise<void> {
  await apiClient.put(ENDPOINTS.ADMIN.USER(studentNumber), input);
}
