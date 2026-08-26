import type {
  AdminMilestoneSubmissionDetailResponse,
  AdminMidtermSubmissionBlockDto,
  AdminProposalDataRowDto,
  AdminProposalScreenDto,
} from '@aics/api-client';

export type AdminProposalSubmissionDetailView = {
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

export type AdminMidtermSubmissionDetailView = {
  blocks: AdminMidtermSubmissionBlockDto[];
  teamLeaderName: string;
  teamName: string;
};

export type AdminMilestoneSubmissionDetailView = {
  milestoneId: string;
  milestoneTitle: string;
  midterm: AdminMidtermSubmissionDetailView | null;
  proposal: AdminProposalSubmissionDetailView | null;
  sectionId: string;
  sectionLabel: string;
  submittedAt: string;
  submissionId: string;
  teamId: string;
  teamName: string;
};

export function toAdminMilestoneSubmissionDetailView(
  response: AdminMilestoneSubmissionDetailResponse,
): AdminMilestoneSubmissionDetailView {
  return {
    milestoneId: response.milestone.id,
    milestoneTitle: response.milestone.title,
    midterm: response.midterm,
    proposal: response.proposal,
    sectionId: response.section.id,
    sectionLabel: response.section.label,
    submittedAt: response.submittedAt,
    submissionId: response.submission.id,
    teamId: response.submission.teamId,
    teamName: response.submission.teamName,
  };
}
