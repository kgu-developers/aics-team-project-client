import type {
  Submission,
  SubmissionArtifactRule,
  SubmissionLinkRule,
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
    key: 'PRESENTATION_PDF',
    label: '발표 자료 PDF',
    required: true,
    allowedExtensions: ['pdf'],
    maxSize: 20 * MB,
  },
  {
    key: 'SOURCE_CODE_ZIP',
    label: '실행 소스 ZIP',
    required: true,
    allowedExtensions: ['zip'],
    maxSize: 50 * MB,
  },
];

const presentationLinkRules: SubmissionLinkRule[] = [
  {
    key: 'PRESENTATION_DEMO_URL',
    label: '시연 URL',
    required: true,
    allowedProtocols: ['http:', 'https:'],
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
  confirmedUserIds?: string[];
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
    updatedAt: '2026-11-04T18:30:00+09:00',
    artifacts: [
      {
        id: 'artifact-presentation-demo-v1',
        kind: 'LINK',
        label: '시연 URL',
        url: 'https://demo.example.com/cineflow',
      },
      {
        id: 'artifact-presentation-v1',
        kind: 'FILE',
        name: 'cineflow-presentation.pdf',
        size: 2_140_000,
        mimeType: 'application/pdf',
      },
      {
        id: 'artifact-presentation-zip-v1',
        kind: 'FILE',
        name: 'cineflow-demo.zip',
        size: 8_400_000,
        mimeType: 'application/zip',
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
      linkRules: presentationLinkRules,
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
      memberConsent: {
        confirmedCount: 0,
        totalCount: 5,
        isConfirmedByMe: false,
      },
      confirmedUserIds: [],
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
      linkRules: presentationLinkRules,
      currentVersion: null,
      versions: [],
      latestVersionHasOfficialReview: false,
    },
    'submission-other-team': {
      id: 'submission-other-team',
      sectionId: demoSubmissionSectionId,
      milestoneId: submissionMilestoneIds.presentation,
      milestoneKind: 'PRESENTATION',
      milestoneTitle: '다른 팀 발표 자료',
      teamId: 'team-99',
      teamName: '다른 팀',
      status: 'NOT_SUBMITTED',
      canSubmitNow: true,
      artifactRules: presentationRules,
      linkRules: presentationLinkRules,
      currentVersion: null,
      versions: [],
      latestVersionHasOfficialReview: false,
    },
  };
}

let state = createInitialState();

function toSubmission(record: SubmissionRecord, userId?: string): Submission {
  const { confirmedUserIds, latestVersionHasOfficialReview, ...submission } =
    record;
  void latestVersionHasOfficialReview;
  return structuredClone({
    ...submission,
    memberConsent: submission.memberConsent
      ? {
          ...submission.memberConsent,
          confirmedCount:
            confirmedUserIds?.length ?? submission.memberConsent.confirmedCount,
          isConfirmedByMe: userId
            ? Boolean(confirmedUserIds?.includes(userId))
            : submission.memberConsent.isConfirmedByMe,
        }
      : undefined,
  });
}

export function getSubmissionByMilestone(
  teamId: string,
  milestoneId: string,
  userId?: string,
) {
  const record = Object.values(state).find(
    submission =>
      submission.teamId === teamId && submission.milestoneId === milestoneId,
  );
  return record ? toSubmission(record, userId) : undefined;
}

export function getSubmissionById(submissionId: string, userId?: string) {
  const record = state[submissionId];
  return record ? toSubmission(record, userId) : undefined;
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
    updatedAt: new Date().toISOString(),
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
      confirmedUserIds: record.memberConsent ? [submittedBy.userId] : undefined,
      memberConsent: record.memberConsent
        ? {
            ...record.memberConsent,
            confirmedCount: 1,
            isConfirmedByMe: false,
          }
        : undefined,
      currentVersion: version,
      versions,
      latestVersionHasOfficialReview: false,
    },
  };
  return getSubmissionById(submissionId);
}

export function updateMockSubmissionConfirmation(
  submissionId: string,
  userId: string,
  confirmed: boolean,
) {
  const record = state[submissionId];
  if (!record?.memberConsent) return undefined;

  const { memberConsent } = record;
  const confirmedUserIds = new Set(record.confirmedUserIds ?? []);
  if (confirmed) confirmedUserIds.add(userId);
  else confirmedUserIds.delete(userId);

  state = {
    ...state,
    [submissionId]: {
      ...record,
      confirmedUserIds: [...confirmedUserIds],
      memberConsent: {
        ...memberConsent,
        confirmedCount: confirmedUserIds.size,
        isConfirmedByMe: false,
      },
    },
  };

  return getSubmissionById(submissionId, userId);
}

export function ensureFinalReportSubmitted() {
  const submissionId = 'submission-final-report';
  const existing = state[submissionId];
  if (existing?.currentVersion) return getSubmissionById(submissionId);

  const submitted = submitMockSubmissionVersion(
    submissionId,
    { userId: 'student-a', name: 'OOP 데모 학생 A' },
    {
      artifacts: [
        {
          kind: 'FILE',
          name: 'cineflow-final-report.pdf',
          size: 2_140_000,
          mimeType: 'application/pdf',
        },
        {
          kind: 'FILE',
          name: 'cineflow-source.zip',
          size: 8_400_000,
          mimeType: 'application/zip',
        },
      ],
    },
  );
  if (!submitted) return undefined;

  const record = state[submissionId];
  if (!record?.memberConsent) return submitted;

  state = {
    ...state,
    [submissionId]: {
      ...record,
      confirmedUserIds: ['student-a', 'student-b', 'student-d', 'student-e'],
      memberConsent: {
        ...record.memberConsent,
        confirmedCount: 4,
      },
    },
  };

  return getSubmissionById(submissionId);
}

export function ensurePresentationNotSubmitted() {
  const submissionId = 'submission-presentation';
  const existing = state[submissionId];
  if (!existing) return undefined;

  state = {
    ...state,
    [submissionId]: {
      ...existing,
      status: 'NOT_SUBMITTED',
      currentVersion: null,
      versions: [],
      latestVersionHasOfficialReview: false,
    },
  };

  return getSubmissionById(submissionId);
}

export function resetSubmissionMockData() {
  state = createInitialState();
}
