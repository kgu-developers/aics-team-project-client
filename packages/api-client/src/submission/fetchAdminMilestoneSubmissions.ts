import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMilestoneSubmissionStatusDto =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'FEEDBACK_PROVIDED'
  | 'REVISION_REQUESTED'
  | 'COMPLETED';

export type AdminMilestoneSubmissionItemDto = {
  canSubmitNow: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  currentVersion: number;
  hasPendingReview: boolean;
  id: number;
  milestoneId: number;
  presentationOrder?: number | null;
  projectTitle?: string | null;
  status: AdminMilestoneSubmissionStatusDto;
  teamId: number;
  teamName: string;
};

export type AdminMilestoneSubmissionsResponse = {
  contents: AdminMilestoneSubmissionItemDto[];
};

export async function fetchAdminMilestoneSubmissions(
  milestoneId: string,
): Promise<AdminMilestoneSubmissionsResponse> {
  const response = await apiClient.get<AdminMilestoneSubmissionsResponse>(
    ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS(milestoneId),
  );

  return response.data;
}
