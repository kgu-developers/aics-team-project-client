export type TeamMilestoneProgressStatus =
  | { kind: 'before-deadline' }
  | { kind: 'not-submitted' }
  | { kind: 'submitted'; submittedDateLabel: string }
  | { kind: 'evaluated' };

export type TeamMilestoneProgress = {
  id: string;
  title: string;
  deadlineLabel: string;
  status: TeamMilestoneProgressStatus;
};
