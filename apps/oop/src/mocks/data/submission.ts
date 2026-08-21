import type {
  Submission,
  SubmissionArtifactRule,
  SubmissionVersion,
  SubmitSubmissionVersionInput,
} from '@aics/core';

export const demoSubmissionSectionId = 'oop-2026-2-01';
export const demoSubmissionTeamId = 'team-07';
export const submissionMilestoneIds = {
  presentation: 'presentation',
  finalReport: 'final-report',
} as const;

const MB = 1024 * 1024;

const presentationRules: SubmissionArtifactRule[] = [
  {
    key: 'PRESENTATION_FILE',
    label: '발표 자료',
    required: true,
    allowedExtensions: ['ppt', 'pptx'],
    maxSize: 20 * MB,
  },
];

const finalReportRules: SubmissionArtifactRule[] = [
  {
    key: 'FINAL_REPORT_PDF',
    label: '최종보고서 PDF',
    required: true,
    allowedExtensions: ['pdf'],
    maxSize: 20 * MB,
  },
  {
    key: 'SOURCE_CODE_ZIP',
    label: '최종 소스코드 ZIP',
    required: true,
    allowedExtensions: ['zip'],
    maxSize: 50 * MB,
  },
];

type SubmissionRecord = Submission & {
  latestVersionHasOfficialReview: boolean;
};

type SubmissionMockState = Record<string, SubmissionRecord>;

function createInitialState(): SubmissionMockState {
  const presentationVersion: SubmissionVersion = {
    id: 'submission-presentation-v1',
    versionNumber: 1,
    description: '팀 발표용 최종 슬라이드입니다.',
    submittedBy: { userId: 'student-b', name: 'OOP 데모 학생 B' },
    submittedAt: '2026-11-04T18:20:00+09:00',
    artifacts: [
      {
        id: 'artifact-presentation-v1',
        kind: 'FILE',
        name: 'cineflow-presentation.pptx',
        size: 4_820_000,
        mimeType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      },
    ],
  };

  return {
    'submission-presentation': {
      id: 'submission-presentation',
      sectionId: demoSubmissionSectionId,
      milestoneId: submissionMilestoneIds.presentation,
      milestoneKind: 'PRESENTATION',
      milestoneTitle: '발표 자료',
      teamId: demoSubmissionTeamId,
      teamName: 'CineFlow (7팀)',
      status: 'SUBMITTED',
      canSubmitNow: true,
      artifactRules: presentationRules,
      currentVersion: presentationVersion,
      versions: [presentationVersion],
      latestVersionHasOfficialReview: true,
    },
    'submission-final-report': {
      id: 'submission-final-report',
      sectionId: demoSubmissionSectionId,
      milestoneId: submissionMilestoneIds.finalReport,
      milestoneKind: 'FINAL_REPORT',
      milestoneTitle: '최종보고서',
      teamId: demoSubmissionTeamId,
      teamName: 'CineFlow (7팀)',
      status: 'NOT_SUBMITTED',
      canSubmitNow: true,
      artifactRules: finalReportRules,
      currentVersion: null,
      versions: [],
      latestVersionHasOfficialReview: false,
    },
    'submission-locked': {
      id: 'submission-locked',
      sectionId: demoSubmissionSectionId,
      milestoneId: 'locked-presentation',
      milestoneKind: 'PRESENTATION',
      milestoneTitle: '마감된 발표 자료',
      teamId: demoSubmissionTeamId,
      teamName: 'CineFlow (7팀)',
      status: 'NOT_SUBMITTED',
      canSubmitNow: false,
      submitDisabledReason: '제출 가능 기간이 종료되었어요.',
      artifactRules: presentationRules,
      currentVersion: null,
      versions: [],
      latestVersionHasOfficialReview: false,
    },
    'submission-other-team': {
      id: 'submission-other-team',
      sectionId: demoSubmissionSectionId,
      milestoneId: 'other-team-presentation',
      milestoneKind: 'PRESENTATION',
      milestoneTitle: '다른 팀 발표 자료',
      teamId: 'team-99',
      teamName: '다른 팀',
      status: 'NOT_SUBMITTED',
      canSubmitNow: true,
      artifactRules: presentationRules,
      currentVersion: null,
      versions: [],
      latestVersionHasOfficialReview: false,
    },
  };
}

let state = createInitialState();

function toSubmission(record: SubmissionRecord): Submission {
  const { latestVersionHasOfficialReview, ...submission } = record;
  void latestVersionHasOfficialReview;
  return structuredClone(submission);
}

export function getSubmissionByMilestone(milestoneId: string) {
  const record = Object.values(state).find(
    submission => submission.milestoneId === milestoneId,
  );
  return record ? toSubmission(record) : undefined;
}

export function getSubmissionById(submissionId: string) {
  const record = state[submissionId];
  return record ? toSubmission(record) : undefined;
}

export function submitMockSubmissionVersion(
  submissionId: string,
  submittedBy: { userId: string; name: string },
  input: SubmitSubmissionVersionInput,
) {
  const record = state[submissionId];
  if (!record) return undefined;

  const currentVersion = record.currentVersion;
  const shouldCreateVersion =
    !currentVersion || record.latestVersionHasOfficialReview;
  const versionNumber = shouldCreateVersion
    ? (currentVersion?.versionNumber ?? 0) + 1
    : currentVersion!.versionNumber;
  const version: SubmissionVersion = {
    id: shouldCreateVersion
      ? `${submissionId}-v${versionNumber}`
      : currentVersion!.id,
    versionNumber,
    description: input.description?.trim() ?? '',
    changeNote: input.changeNote?.trim() || undefined,
    submittedBy,
    submittedAt: new Date().toISOString(),
    artifacts: input.artifacts.map((artifact, index) => ({
      ...artifact,
      id: `${submissionId}-v${versionNumber}-artifact-${index + 1}`,
    })),
  };
  const versions = shouldCreateVersion
    ? [version, ...record.versions]
    : record.versions.map(existing =>
        existing.id === version.id ? version : existing,
      );

  state = {
    ...state,
    [submissionId]: {
      ...record,
      status: 'SUBMITTED',
      currentVersion: version,
      versions,
      latestVersionHasOfficialReview: false,
    },
  };
  return getSubmissionById(submissionId);
}

export function resetSubmissionMockData() {
  state = createInitialState();
}
