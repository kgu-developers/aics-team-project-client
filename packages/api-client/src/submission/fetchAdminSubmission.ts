import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSubmissionStatusDto =
  | 'APPROVED'
  | 'COMPLETED'
  | 'FEEDBACK_PROVIDED'
  | 'NOT_SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'SUBMITTED';

export type AdminSubmissionResponse = {
  canSubmitNow: boolean;
  completedAt?: string;
  completedBy?: string;
  currentVersion: number;
  hasPendingReview: boolean;
  id: number;
  meetingRecordCount: number;
  milestoneId: number;
  presentationOrder?: number;
  status: AdminSubmissionStatusDto;
  teamId: number;
  teamName: string;
};

/**
 * Existing feedback-panel contract. Feedback retrieval is not part of the
 * admin submission detail API and remains owned by the feedback feature.
 */
export type AdminFeedbackEntryDto = {
  authorName: string;
  content: string;
  createdAt: string;
  feedbackId: string;
};

export type AdminStudentResponseDto = {
  authorName: string;
  content: string;
  createdAt: string;
  responseId: string;
};

export type AdminProposalFeedbackDto = {
  history: AdminFeedbackEntryDto[];
  latestStudentResponse: AdminStudentResponseDto | null;
};

export type AdminMidtermFeedbackDto = AdminProposalFeedbackDto;

export async function fetchAdminSubmission(
  submissionId: string,
): Promise<AdminSubmissionResponse> {
  const response = await apiClient.get<AdminSubmissionResponse>(
    ENDPOINTS.ADMIN.SUBMISSION(submissionId),
  );

  return response.data;
}
