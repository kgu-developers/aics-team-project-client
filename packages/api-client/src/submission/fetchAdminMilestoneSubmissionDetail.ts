import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminProposalDataRowDto = {
  count: number;
  description: string;
  name: string;
};

export type AdminProposalScreenDto = {
  description: string;
  name: string;
};

export type AdminProposalSubmissionDetailDto = {
  collaboration: string;
  dataRows: AdminProposalDataRowDto[];
  introduction: string;
  members: string[];
  projectDescription: string;
  projectTitle: string;
  roles: string;
  schedule: string;
  screenDescription: string;
  screens: AdminProposalScreenDto[];
  teamLeaderName: string;
  teamName: string;
  wireframeFileNames: string[];
};

export type AdminMidtermSubmissionFieldDto = {
  label: string;
  value: string;
};

export type AdminMidtermSubmissionBlockDto = {
  description: string;
  fields: AdminMidtermSubmissionFieldDto[];
  title: string;
};

export type AdminMidtermSubmissionDetailDto = {
  blocks: AdminMidtermSubmissionBlockDto[];
  teamLeaderName: string;
  teamName: string;
};

export type AdminPresentationSubmissionBlockDto = {
  description: string;
  fields: AdminMidtermSubmissionFieldDto[];
  title: string;
};

export type AdminPresentationSubmissionDetailDto = {
  blocks: AdminPresentationSubmissionBlockDto[];
  presentationFileName: string | null;
  sourceArchiveFileName: string | null;
  teamLeaderName: string;
  teamName: string;
  videoUrl: string | null;
};

export type AdminPeerEvaluationMemberDto = {
  major: string;
  name: string;
  studentNumber: string;
};

export type AdminPeerEvaluationScoreDto = {
  evaluatorStudentNumber: string;
  projectEvaluation: {
    roleSummary: string;
    teamEvaluation: string;
    reflection: string;
  };
  scores: Record<string, number>;
};

export type AdminPeerEvaluationDetailDto = {
  members: AdminPeerEvaluationMemberDto[];
  responses: AdminPeerEvaluationScoreDto[];
};

export type AdminMilestoneSubmissionDetailResponse = {
  milestone: {
    id: string;
    title: string;
  };
  midterm: AdminMidtermSubmissionDetailDto | null;
  peerEvaluation?: AdminPeerEvaluationDetailDto | null;
  presentation: AdminPresentationSubmissionDetailDto | null;
  proposal: AdminProposalSubmissionDetailDto | null;
  section: {
    id: string;
    label: string;
  };
  submittedAt: string;
  submission: {
    id: string;
    teamId: string;
    teamName: string;
  };
};

export async function fetchAdminMilestoneSubmissionDetail(
  submissionId: string,
): Promise<AdminMilestoneSubmissionDetailResponse> {
  const response = await apiClient.get<AdminMilestoneSubmissionDetailResponse>(
    ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL(submissionId),
  );

  return response.data;
}
