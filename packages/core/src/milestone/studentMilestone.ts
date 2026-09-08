export type StudentMilestoneResponse = {
  id: number;
  sectionId: number;
  title: string;
  description?: string | null;
  type:
    | 'PROPOSAL'
    | 'MID_REPORT'
    | 'FINAL_REPORT'
    | 'PRESENTATION'
    | 'PEER_EVALUATION'
    | 'GENERAL';
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  weekNumber: number;
  allowResubmissionBeforeDueAt: boolean;
  schedule: {
    opensAt?: string | null;
    dueAt?: string | null;
    revisionUntil?: string | null;
    lateSubmissionUntil?: string | null;
    evaluationOpensAt?: string | null;
    evaluationClosesAt?: string | null;
  };
};

export type StudentMilestoneListResponse = {
  contents: StudentMilestoneResponse[];
};

export type MyTeamMilestoneSubmissionResponse = {
  id: number;
  milestoneId: number;
  teamId: number;
  status:
    | 'NOT_SUBMITTED'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'FEEDBACK_PROVIDED'
    | 'REVISION_REQUESTED'
    | 'COMPLETED';
  currentVersion: number;
  canSubmitNow: boolean;
  hasPendingReview: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  presentationOrder?: number | null;
  memberConsent?: {
    confirmedCount: number;
    totalCount: number;
    isConfirmedByMe: boolean;
  } | null;
};
