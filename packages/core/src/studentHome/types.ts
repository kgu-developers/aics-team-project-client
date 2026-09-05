import type {
  MidReportFeedback,
  ProposalFeedbackResponse,
} from '../feedback/types';

export type StudentHomeMilestoneStatus =
  'before-period' | 'in-progress' | 'revision-available' | 'completed';

export type StudentHomeMilestoneRowTone = 'default' | 'primary' | 'muted';

export type StudentHomeMilestoneRow = {
  id: string;
  label: string;
  value: string;
  tone: StudentHomeMilestoneRowTone;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionNotice?: string;
  actionTo?: string;
};

export type StudentHomeTopicCandidate = {
  id: string;
  title: string;
  proposer: string;
  description: string;
  voteCount: number;
  isMine: boolean;
  isMyVote: boolean;
};

export type StudentHomeSectionStatus = {
  id: string;
  label: string;
  statusLabel: string;
  status: 'completed' | 'in-progress' | 'not-started';
  updatedAt?: string;
  to?: string;
};

export type StudentHomeProject = {
  title: string;
  description: string;
};

export type StudentHomeFeedbackMessage = {
  id: string;
  title: string;
  content: string;
};

export type StudentHomeFile = {
  id: string;
  extension: string;
  name: string;
};

export type StudentHomeSubmissionMaterial = {
  id: string;
  kind: 'FILE' | 'LINK';
  label: string;
  extension: string;
  value?: string;
  href?: string;
};

export type StudentHomeTeamStatus = {
  id: string;
  label: string;
  isMine: boolean;
};

export type StudentHomeSubmissionMetadata = {
  submittedBy: string;
  submittedAt: string;
  updatedAt: string;
};

export type StudentHomeMilestoneBody =
  | {
      kind: 'topic';
      guidance: string;
      topicCandidates: StudentHomeTopicCandidate[];
      completion: {
        label: string;
        value: string;
      };
    }
  | {
      kind: 'proposal';
      project: StudentHomeProject;
      sections: StudentHomeSectionStatus[];
    }
  | {
      kind: 'proposal-feedback';
      reviewId: string;
      feedback: StudentHomeFeedbackMessage[];
      studentResponse?: ProposalFeedbackResponse;
      canSubmitResponse: boolean;
      responseBlockedReason?: string;
      replyPlaceholder: string;
      sections: StudentHomeSectionStatus[];
      guide: string;
    }
  | {
      kind: 'mid-review';
      project: StudentHomeProject;
      sections: StudentHomeSectionStatus[];
    }
  | {
      kind: 'mid-review-feedback';
      submissionId: string;
      feedback: StudentHomeFeedbackMessage[];
      studentFeedback?: MidReportFeedback;
      canSubmitResponse: boolean;
      responseBlockedReason?: string;
      sections: StudentHomeSectionStatus[];
      guide: string;
    }
  | {
      kind: 'presentation-material';
      project: StudentHomeProject;
      sections: StudentHomeSectionStatus[];
      materials: StudentHomeSubmissionMaterial[];
      submission?: StudentHomeSubmissionMetadata;
    }
  | {
      kind: 'presentation-evaluation';
      project: StudentHomeProject;
      orderGuide: string;
      teams: StudentHomeTeamStatus[];
      timeGuide: string;
    }
  | {
      kind: 'final-report';
      submissionId?: string;
      notice: {
        description: string;
        file?: StudentHomeFile;
      };
      materials: StudentHomeSubmissionMaterial[];
      submission?: StudentHomeSubmissionMetadata;
      memberConsent?: {
        confirmedCount: number;
        totalCount: number;
        isConfirmedByMe: boolean;
      };
    }
  | {
      kind: 'peer-evaluation';
      sections: StudentHomeSectionStatus[];
    };

export type StudentHomeMilestone = {
  id: string;
  title: string;
  period: string;
  statusLabel: string;
  status: StudentHomeMilestoneStatus;
  dueDate: string;
  currentStepLabel?: string;
  interaction: 'static' | 'collapsible';
  isDetailAvailable: boolean;
  rows: StudentHomeMilestoneRow[];
  body?: StudentHomeMilestoneBody;
};

export type StudentHomeAnnouncement = {
  id: string;
  title: string;
  content: string;
  date: string;
};

export type StudentHomeHero = {
  date: string;
  heading: string;
  description: string;
  ctaLabel: string;
  actionTo?: string;
};

export type StudentHomeDashboard = {
  hero: StudentHomeHero;
  announcements: StudentHomeAnnouncement[];
  milestones: StudentHomeMilestone[];
};
