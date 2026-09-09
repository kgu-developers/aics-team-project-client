import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSubmissionArtifactTypeDto =
  'CHEERPJ_RUN' | 'FILE' | 'LINK' | 'TEXT';

export type AdminSubmissionArtifactDto = {
  content?: string;
  downloadUrl?: string;
  fileId?: number;
  fileName?: string;
  requiredArtifactId?: number;
  type: AdminSubmissionArtifactTypeDto;
  url?: string;
};

export type AdminSubmissionSubmitterDto = {
  name: string;
  userId: string;
};

export type AdminSubmissionVersionResponse = {
  artifacts: AdminSubmissionArtifactDto[];
  changeNote?: string;
  description?: string;
  late: boolean;
  submittedAt: string;
  /** Swagger returns an object; string keeps legacy mock responses readable. */
  submittedBy: AdminSubmissionSubmitterDto | string;
  version: number;
};

export async function fetchAdminSubmissionVersion(
  submissionId: string,
  version: number,
): Promise<AdminSubmissionVersionResponse> {
  const response = await apiClient.get<AdminSubmissionVersionResponse>(
    ENDPOINTS.ADMIN.SUBMISSION_VERSION(submissionId, version),
  );

  return response.data;
}
