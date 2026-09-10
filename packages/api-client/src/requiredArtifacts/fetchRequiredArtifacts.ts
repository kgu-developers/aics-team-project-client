import { apiClient } from '../client';
import type { RequiredArtifactsResponse } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchRequiredArtifacts(
  sectionId: string,
  milestoneId: string,
): Promise<RequiredArtifactsResponse> {
  const response = await apiClient.get<RequiredArtifactsResponse>(
    ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS(sectionId, milestoneId),
  );

  return response.data;
}
