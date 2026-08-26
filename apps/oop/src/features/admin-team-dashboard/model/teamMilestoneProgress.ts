export type TeamMilestoneProgressStatus =
  | { kind: 'before-deadline' }
  | { kind: 'not-submitted' }
  | { kind: 'submitted'; submittedDateLabel: string }
  | { kind: 'evaluated' };

export type TeamMilestoneDownloadFile = {
  downloadUrl: string;
  fileName: string;
  label: string;
};

export type TeamMilestoneProgress = {
  id: string;
  title: string;
  deadlineLabel: string;
  downloadFiles?: TeamMilestoneDownloadFile[];
  submissionId: string | null;
  status: TeamMilestoneProgressStatus;
};
