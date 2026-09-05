import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type UpdateUserPasswordInput = {
  studentNumber: string;
  currentPassword: string;
  password: string;
};

export async function updateUserPassword({
  studentNumber,
  currentPassword,
  password,
}: UpdateUserPasswordInput): Promise<string> {
  const response = await apiClient.put<string>(
    ENDPOINTS.PROFILE.PASSWORD(studentNumber),
    { currentPassword, password },
  );

  return response.data;
}
