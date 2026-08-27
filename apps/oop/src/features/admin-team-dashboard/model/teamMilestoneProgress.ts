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

export type TeamMilestoneSummary = {
  attachmentCount?: number | null;
  presentationFileDownloadUrl?: string | null;
  presentationFileName?: string | null;
  sourceArchiveDownloadUrl?: string | null;
  sourceArchiveFileName?: string | null;
  videoUrl?: string | null;
};

export type TeamMilestoneProgress = {
  id: string;
  title: string;
  deadlineLabel: string;
  downloadFiles?: TeamMilestoneDownloadFile[];
  summary?: TeamMilestoneSummary;
  submissionId: string | null;
  status: TeamMilestoneProgressStatus;
  submittedMemberCount?: number | null;
  memberCount?: number | null;
};
