import { apiClient } from '../client';
import type { RequiredArtifactInput } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitRequiredArtifact(
  sectionId: string,
  milestoneId: string,
  input: RequiredArtifactInput,
): Promise<void> {
  await apiClient.post(
    ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS(sectionId, milestoneId),
    input,
  );
}
