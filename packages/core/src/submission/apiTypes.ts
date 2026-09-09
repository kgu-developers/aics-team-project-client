import type { MyTeamMilestoneSubmissionResponse } from '../milestone/studentMilestone';

export type StudentSubmissionResponse = MyTeamMilestoneSubmissionResponse;
export type StudentSubmissionStatus = StudentSubmissionResponse['status'];

export type StudentSubmissionArtifact = {
  type: 'FILE' | 'LINK' | 'TEXT' | 'CHEERPJ_RUN';
  requiredArtifactId?: number | null;
  fileId?: number | null;
  fileName?: string | null;
  size?: number | null;
  mimeType?: string | null;
  downloadUrl?: string | null;
  url?: string | null;
  content?: string | null;
};
export type StudentSubmissionVersionResponse = {
  id: number;
  version: number;
  description?: string | null;
  changeNote?: string | null;
  submittedBy: { userId: string; name: string };
  submittedAt: string;
  updatedAt: string;
  late: boolean;
  artifacts: StudentSubmissionArtifact[];
};
export type StudentSubmissionVersionsResponse = {
  contents: StudentSubmissionVersionResponse[];
};
