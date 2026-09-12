export type AdminEvaluationMeetingRecordDto = {
  id: number;
  meetingAt: string;
  participantCount: number;
  phase: 'PROPOSAL' | 'MID_CHECK' | 'FINAL';
  title: string;
};

export type AdminPeerEvaluationListInput = {
  formId?: number;
};

export type AdminPeerEvaluationTeamDetailInput =
  AdminPeerEvaluationListInput & {
    teamId: number;
  };

export type AdminPeerEvaluationTeamSummaryDto = {
  lastSubmittedAt: string | null;
  meetingRecordCount: number;
  submittedCount: number;
  teamId: number;
  teamName: string;
  totalMemberCount: number;
};

export type AdminPeerEvaluationListResponse = {
  closesAt: string | null;
  formId: number | null;
  opensAt: string | null;
  sectionId: number;
  teams: AdminPeerEvaluationTeamSummaryDto[];
};

export type AdminPeerEvaluationMemberDto = {
  averageReceivedScore: number | null;
  isLeader: boolean;
  name: string;
  role: string | null;
  userId: string;
};

export type AdminPeerEvaluationScoreDto = {
  contributionPercent: number | null;
  isSelf: boolean;
  targetUserId: string;
  targetUserName: string;
};

export type AdminPeerEvaluationTeammateAssessmentDto = {
  contributionDetail: string | null;
  targetUserId: string;
  targetUserName: string;
  teammateAssessment: string | null;
};

export type AdminPeerEvaluationRowDto = {
  averageScore: number | null;
  evaluatorId: string;
  evaluatorName: string;
  isLeader: boolean;
  projectReviewComment: string | null;
  reflectionComment: string | null;
  scores: AdminPeerEvaluationScoreDto[];
  selfContribution: string | null;
  status: 'DRAFT' | 'SUBMITTED' | null;
  submittedAt: string | null;
  teammateAssessments: AdminPeerEvaluationTeammateAssessmentDto[];
};

export type AdminPeerEvaluationTeamDetailResponse = {
  closesAt: string | null;
  evaluations: AdminPeerEvaluationRowDto[];
  formId: number;
  meetingRecords: AdminEvaluationMeetingRecordDto[];
  members: AdminPeerEvaluationMemberDto[];
  teamId: number;
  teamName: string;
};

export type AdminPresentationEvaluationListInput = {
  milestoneId?: number;
};

export type AdminPresentationEvaluationTeamDetailInput =
  AdminPresentationEvaluationListInput & {
    teamId: number;
  };

export type AdminPresentationEvaluationCriterionDto = {
  criterionId: number;
  displayOrder: number;
  maxScore: number;
  title: string;
};

export type AdminPresentationEvaluationScoreDto = {
  criterionId: number;
  criterionTitle: string;
  score: number | null;
};

export type AdminPresentationEvaluationTeamSummaryDto = {
  evaluationCount: number;
  projectTitle: string | null;
  scores: AdminPresentationEvaluationScoreDto[];
  teamId: number;
  teamName: string;
  totalScore: number | null;
};

export type AdminPresentationEvaluationListResponse = {
  closesAt: string | null;
  criteria: AdminPresentationEvaluationCriterionDto[];
  milestoneId: number;
  milestoneTitle: string;
  sectionId: number;
  teams: AdminPresentationEvaluationTeamSummaryDto[];
};

export type AdminPresentationEvaluationRowDto = {
  evaluatorId: string;
  evaluatorName: string;
  isSubmitted: boolean;
  scores: AdminPresentationEvaluationScoreDto[];
  submittedAt: string | null;
  teamName: string;
  totalScore: number | null;
};

export type AdminPresentationEvaluationTeamDetailResponse = {
  closesAt: string | null;
  criteria: AdminPresentationEvaluationCriterionDto[];
  evaluations: AdminPresentationEvaluationRowDto[];
  meetingRecords: AdminEvaluationMeetingRecordDto[];
  milestoneId: number;
  projectTitle: string | null;
  teamId: number;
  teamName: string;
};
