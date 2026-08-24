import type { MyProfileResponse } from './fetchMyProfile';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type UpdateMyProfileInput = {
  introduction: string;
};

export async function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<MyProfileResponse> {
  const response = await apiClient.patch<MyProfileResponse>(
    ENDPOINTS.PROFILE.ME,
    input,
  );

  return response.data;
}
