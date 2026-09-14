import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type SubmitAdminUserInput = {
  studentNumber: string;
  email: string;
  name: string;
  password: string;
  globalRole: 'USER';
  phone: string;
};

export async function submitAdminUser(input: SubmitAdminUserInput): Promise<{
  studentNumber: string;
}> {
  const response = await apiClient.post<{ studentNumber: string }>(
    ENDPOINTS.ADMIN.USERS,
    input,
  );

  return response.data;
}
