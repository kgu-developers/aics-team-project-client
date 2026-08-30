import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type UpdateMyPasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export async function updateMyPassword(
  input: UpdateMyPasswordInput,
): Promise<void> {
  await apiClient.patch(ENDPOINTS.PROFILE.PASSWORD, input);
}
