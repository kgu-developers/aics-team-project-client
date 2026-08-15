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
  meta: string;
};

export type StudentHomeTeamStatus = {
  id: string;
  label: string;
  isMine: boolean;
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
      feedback: StudentHomeFeedbackMessage[];
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
      feedback: StudentHomeFeedbackMessage[];
      sections: StudentHomeSectionStatus[];
      guide: string;
    }
  | {
      kind: 'presentation-material';
      project: StudentHomeProject;
      sections: StudentHomeSectionStatus[];
      recentFile?: StudentHomeFile;
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
      notice: {
        description: string;
        file?: StudentHomeFile;
      };
      submittedFile?: StudentHomeFile;
      uploadHint: string;
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
};

export type StudentHomeDashboard = {
  hero: StudentHomeHero;
  announcements: StudentHomeAnnouncement[];
  milestones: StudentHomeMilestone[];
};
