import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSectionMilestoneSubmissionSummaryDto = {
  attachmentCount: number | null;
  feedbackCount: number | null;
  leaderName: string | null;
  linkLabel: string | null;
  presentationFileName: string | null;
  projectTopic: string | null;
  reportFileName: string | null;
  reportDownloadUrl: string | null;
  sourceArchiveFileName: string | null;
  sourceArchiveDownloadUrl: string | null;
  submittedMemberCount: number | null;
};

export type AdminSectionMilestoneSubmissionItemDto = {
  id: string;
  meetingRecordCount: number | null;
  messageCount: number | null;
  submissionId: string | null;
  submittedAt: string | null;
  summary: AdminSectionMilestoneSubmissionSummaryDto;
  teamId: string;
  teamName: string;
};

export type AdminSectionMilestoneSubmissionsResponse = {
  milestone: {
    id: string;
    title: string;
  };
  section: {
    id: string;
    label: string;
  };
  submissions: AdminSectionMilestoneSubmissionItemDto[];
};

export async function fetchAdminSectionMilestoneSubmissions(
  sectionId: string,
  milestoneId: string,
): Promise<AdminSectionMilestoneSubmissionsResponse> {
  const response =
    await apiClient.get<AdminSectionMilestoneSubmissionsResponse>(
      ENDPOINTS.ADMIN.SECTION_MILESTONE_SUBMISSIONS(sectionId, milestoneId),
    );

  return response.data;
}
