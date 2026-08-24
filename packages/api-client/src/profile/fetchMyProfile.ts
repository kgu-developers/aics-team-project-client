import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type MyProfileResponse = {
  introduction: string;
};

export async function fetchMyProfile(): Promise<MyProfileResponse> {
  const response = await apiClient.get<MyProfileResponse>(ENDPOINTS.PROFILE.ME);

  return response.data;
}
