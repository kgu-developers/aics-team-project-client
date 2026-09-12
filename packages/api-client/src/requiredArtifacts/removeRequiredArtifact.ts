import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeRequiredArtifact(
  sectionId: string,
  milestoneId: string,
  requiredArtifactId: string,
): Promise<void> {
  await apiClient.delete(
    ENDPOINTS.ADMIN.REQUIRED_ARTIFACT(
      sectionId,
      milestoneId,
      requiredArtifactId,
    ),
  );
}
