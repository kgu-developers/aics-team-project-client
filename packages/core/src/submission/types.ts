export type SubmissionMilestoneKind = 'PRESENTATION' | 'FINAL_REPORT';

export type SubmissionStatus =
  'NOT_SUBMITTED' | 'SUBMITTED' | 'REVISION_REQUESTED';

export type SubmissionFileArtifact = {
  id: string;
  kind: 'FILE';
  name: string;
  size: number;
  mimeType: string;
};

export type SubmissionLinkArtifact = {
  id: string;
  kind: 'LINK';
  label: string;
  url: string;
};

export type SubmissionArtifact =
  SubmissionFileArtifact | SubmissionLinkArtifact;

export type SubmissionVersion = {
  id: string;
  versionNumber: number;
  description: string;
  changeNote?: string;
  submittedBy: {
    userId: string;
    name: string;
  };
  submittedAt: string;
  artifacts: SubmissionArtifact[];
};

export type SubmissionArtifactRule = {
  key: 'PRESENTATION_PDF' | 'FINAL_REPORT_PDF' | 'SOURCE_CODE_ZIP';
  label: string;
  required: true;
  allowedExtensions: string[];
  maxSize: number;
};

export type Submission = {
  id: string;
  sectionId: string;
  milestoneId: string;
  milestoneKind: SubmissionMilestoneKind;
  milestoneTitle: string;
  teamId: string;
  teamName: string;
  status: SubmissionStatus;
  canSubmitNow: boolean;
  submitDisabledReason?: string;
  artifactRules: SubmissionArtifactRule[];
  currentVersion: SubmissionVersion | null;
  versions: SubmissionVersion[];
};

export type SubmitSubmissionFileArtifactInput = {
  kind: 'FILE';
  name: string;
  size: number;
  mimeType: string;
};

export type SubmitSubmissionVersionInput = {
  description?: string;
  changeNote?: string;
  artifacts: SubmitSubmissionFileArtifactInput[];
};
