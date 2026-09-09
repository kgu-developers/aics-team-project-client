import { apiClient } from '../client';
import type { AdminSubmissionSubmitterDto } from './fetchAdminSubmissionVersion';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSubmissionVersionSummaryDto = {
  changeNote?: string;
  description?: string;
  late: boolean;
  submittedAt: string;
  submittedBy: AdminSubmissionSubmitterDto | string;
  version: number;
};

export type AdminSubmissionVersionsResponse = {
  contents: AdminSubmissionVersionSummaryDto[];
};

export async function fetchAdminSubmissionVersions(
  submissionId: string,
): Promise<AdminSubmissionVersionsResponse> {
  const response = await apiClient.get<AdminSubmissionVersionsResponse>(
    ENDPOINTS.ADMIN.SUBMISSION_VERSIONS(submissionId),
  );

  return response.data;
}
