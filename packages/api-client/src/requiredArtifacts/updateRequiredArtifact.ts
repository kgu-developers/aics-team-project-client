import { apiClient } from '../client';
import type { RequiredArtifactInput } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateRequiredArtifact(
  sectionId: string,
  milestoneId: string,
  requiredArtifactId: string,
  input: RequiredArtifactInput,
): Promise<void> {
  await apiClient.put(
    ENDPOINTS.ADMIN.REQUIRED_ARTIFACT(
      sectionId,
      milestoneId,
      requiredArtifactId,
    ),
    input,
  );
}
