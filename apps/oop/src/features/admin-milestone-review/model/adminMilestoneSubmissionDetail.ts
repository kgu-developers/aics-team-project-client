import type {
  AdminSubmissionArtifactDto,
  AdminSubmissionArtifactTypeDto,
  AdminSubmissionResponse,
  AdminSubmissionStatusDto,
  AdminSubmissionVersionResponse,
  AdminSubmissionVersionSummaryDto,
  AdminSubmissionVersionsResponse,
} from '@aics/api-client';

const submissionStatusLabels: Record<AdminSubmissionStatusDto, string> = {
  APPROVED: '승인됨',
  COMPLETED: '완료',
  FEEDBACK_PROVIDED: '피드백 제공',
  NOT_SUBMITTED: '미제출',
  REVISION_REQUESTED: '수정 요청',
  SUBMITTED: '제출 완료',
};

const artifactTypeLabels: Record<AdminSubmissionArtifactTypeDto, string> = {
  CHEERPJ_RUN: 'CheerpJ 실행',
  FILE: '파일',
  LINK: '링크',
  TEXT: '텍스트',
};

export type AdminSubmissionDetailView = {
  canSubmitNow: boolean;
  completedAt: string | null;
  completedBy: string | null;
  currentVersion: number;
  hasPendingReview: boolean;
  milestoneId: string;
  presentationOrder: number | null;
  status: AdminSubmissionStatusDto;
  statusLabel: string;
  submissionId: string;
  teamId: string;
  teamName: string;
};

export type AdminSubmissionVersionSummaryView = {
  changeNote: string | null;
  description: string | null;
  isLate: boolean;
  submittedAt: string;
  submittedBy: string;
  version: number;
};

export type AdminSubmissionArtifactView = {
  content: string | null;
  downloadUrl: string | null;
  fileName: string | null;
  label: string;
  type: AdminSubmissionArtifactTypeDto;
  url: string | null;
};

export type AdminSubmissionVersionDetailView =
  AdminSubmissionVersionSummaryView & {
    artifacts: AdminSubmissionArtifactView[];
  };

function toSubmissionVersionSummaryView(
  version: AdminSubmissionVersionSummaryDto,
): AdminSubmissionVersionSummaryView {
  return {
    changeNote: version.changeNote ?? null,
    description: version.description ?? null,
    isLate: version.late,
    submittedAt: version.submittedAt,
    submittedBy: version.submittedBy,
    version: version.version,
  };
}

function toArtifactView(
  artifact: AdminSubmissionArtifactDto,
): AdminSubmissionArtifactView {
  return {
    content: artifact.content ?? null,
    downloadUrl: artifact.downloadUrl ?? null,
    fileName: artifact.fileName ?? null,
    label: artifactTypeLabels[artifact.type],
    type: artifact.type,
    url: artifact.url ?? null,
  };
}

export function toAdminSubmissionDetailView(
  response: AdminSubmissionResponse,
): AdminSubmissionDetailView {
  return {
    canSubmitNow: response.canSubmitNow,
    completedAt: response.completedAt ?? null,
    completedBy: response.completedBy ?? null,
    currentVersion: response.currentVersion,
    hasPendingReview: response.hasPendingReview,
    milestoneId: String(response.milestoneId),
    presentationOrder: response.presentationOrder ?? null,
    status: response.status,
    statusLabel: submissionStatusLabels[response.status],
    submissionId: String(response.id),
    teamId: String(response.teamId),
    teamName: response.teamName,
  };
}

export function toAdminSubmissionVersionsView(
  response: AdminSubmissionVersionsResponse,
): AdminSubmissionVersionSummaryView[] {
  return response.contents.map(toSubmissionVersionSummaryView);
}

export function toAdminSubmissionVersionDetailView(
  response: AdminSubmissionVersionResponse,
): AdminSubmissionVersionDetailView {
  return {
    ...toSubmissionVersionSummaryView(response),
    artifacts: response.artifacts.map(toArtifactView),
  };
}
