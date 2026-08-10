export type StudentHomeMilestoneStatus = 'before-period' | 'completed';

export type StudentHomeMilestoneRowTone = 'default' | 'primary' | 'muted';

export type StudentHomeMilestoneRow = {
  id: string;
  label: string;
  value: string;
  tone: StudentHomeMilestoneRowTone;
  actionLabel?: string;
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

export type StudentHomeMilestoneArtifact = {
  id: string;
  label: string;
  detail: string;
  status: 'submitted' | 'missing';
};

export type StudentHomeMilestoneContentItem = {
  id: string;
  label: string;
  statusLabel: string;
  status: 'completed' | 'in-progress' | 'not-started';
  updatedAt?: string;
};

export type StudentHomeMilestoneBody =
  | {
      kind: 'proposal';
      guidance: string;
      topicCandidates: StudentHomeTopicCandidate[];
      completion: {
        label: string;
        value: string;
      };
    }
  | {
      kind: 'submission';
      guidance: string;
      artifacts: StudentHomeMilestoneArtifact[];
      reviewSummary?: string;
    }
  | {
      kind: 'presentation';
      guidance: string;
      project: {
        title: string;
        description: string;
      };
      contentItems: StudentHomeMilestoneContentItem[];
      evaluationWindow?: string;
    }
  | {
      kind: 'peer-evaluation';
      guidance: string;
      evaluationWindow: string;
      completion: {
        label: string;
        value: string;
      };
    };

export type StudentHomeMilestone = {
  id: string;
  title: string;
  period: string;
  statusLabel: string;
  status: StudentHomeMilestoneStatus;
  dueDate: string;
  interaction: 'static' | 'collapsible';
  isOpen: boolean;
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
