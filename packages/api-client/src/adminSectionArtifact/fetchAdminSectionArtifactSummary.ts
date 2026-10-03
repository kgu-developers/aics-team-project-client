import type {
  AdminSectionArtifactSummaryResponse,
  AdminSectionArtifactsInput,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminSectionArtifactSummary({
  asOf,
  sectionId,
}: AdminSectionArtifactsInput): Promise<AdminSectionArtifactSummaryResponse> {
  const response = await apiClient.get<AdminSectionArtifactSummaryResponse>(
    ENDPOINTS.ADMIN.SECTION_ARTIFACT_SUMMARY(sectionId),
    { params: { asOf } },
  );

  return response.data;
}
