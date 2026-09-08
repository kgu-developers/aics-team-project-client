import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminUserDto = {
  studentNumber: string;
  email: string;
  name: string;
  globalRole: 'ADMIN' | 'USER';
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminUser(
  studentNumber: string,
): Promise<AdminUserDto> {
  const response = await apiClient.get<AdminUserDto>(
    ENDPOINTS.ADMIN.USER(studentNumber),
  );

  return response.data;
}
