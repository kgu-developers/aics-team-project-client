import type {
  AdminSubmissionResponse,
  AdminSubmissionVersionResponse,
  AdminSubmissionVersionsResponse,
} from '@aics/api-client';

type SubmissionFixture = {
  detail: AdminSubmissionResponse;
  versions: AdminSubmissionVersionsResponse;
  versionDetails: Record<number, AdminSubmissionVersionResponse>;
};

const submissionFixtures: Record<string, SubmissionFixture> = {
  '1001': {
    detail: {
      canSubmitNow: true,
      currentVersion: 2,
      hasPendingReview: true,
      id: 1001,
      milestoneId: 101,
      status: 'REVISION_REQUESTED',
      teamId: 11,
      teamName: 'OOP-01 - 1팀',
    },
    versionDetails: {
      1: {
        artifacts: [
          {
            downloadUrl: 'https://files.example.com/proposal-v1.pdf',
            fileName: 'proposal-v1.pdf',
            type: 'FILE',
          },
          { type: 'TEXT', content: '초기 제안서 내용입니다.' },
        ],
        description: '초기 제안서',
        late: false,
        submittedAt: '2026-09-01T09:00:00Z',
        submittedBy: '20230001',
        version: 1,
      },
      2: {
        artifacts: [
          {
            downloadUrl: 'https://files.example.com/proposal-v2.pdf',
            fileName: 'proposal-v2.pdf',
            type: 'FILE',
          },
          { type: 'LINK', url: 'https://github.com/kgu-developers/example' },
          { type: 'TEXT', content: '역할 분담과 범위를 보완했습니다.' },
        ],
        changeNote: '피드백 반영',
        description: '보완된 제안서',
        late: false,
        submittedAt: '2026-09-07T09:00:00Z',
        submittedBy: '20230001',
        version: 2,
      },
    },
    versions: {
      contents: [
        {
          changeNote: '피드백 반영',
          description: '보완된 제안서',
          late: false,
          submittedAt: '2026-09-07T09:00:00Z',
          submittedBy: '20230001',
          version: 2,
        },
        {
          description: '초기 제안서',
          late: false,
          submittedAt: '2026-09-01T09:00:00Z',
          submittedBy: '20230001',
          version: 1,
        },
      ],
    },
  },
  '1003': {
    detail: {
      canSubmitNow: false,
      currentVersion: 2,
      hasPendingReview: false,
      id: 1003,
      milestoneId: 102,
      status: 'FEEDBACK_PROVIDED',
      teamId: 11,
      teamName: 'OOP-01 - 1팀',
    },
    versionDetails: {
      2: {
        artifacts: [
          { content: '중간 점검 결과입니다.', type: 'TEXT' },
          {
            downloadUrl: 'https://files.example.com/midterm.pdf',
            fileName: 'midterm.pdf',
            type: 'FILE',
          },
        ],
        late: false,
        submittedAt: '2026-10-14T09:00:00Z',
        submittedBy: '20230001',
        version: 2,
      },
    },
    versions: {
      contents: [
        {
          late: false,
          submittedAt: '2026-10-14T09:00:00Z',
          submittedBy: '20230001',
          version: 2,
        },
      ],
    },
  },
  '1005': {
    detail: {
      canSubmitNow: false,
      completedAt: '2026-12-08T12:00:00Z',
      completedBy: '담당 교수',
      currentVersion: 1,
      hasPendingReview: false,
      id: 1005,
      milestoneId: 104,
      status: 'COMPLETED',
      teamId: 11,
      teamName: 'OOP-01 - 1팀',
    },
    versionDetails: {
      1: {
        artifacts: [
          {
            downloadUrl: 'https://files.example.com/final-report.pdf',
            fileName: 'final-report.pdf',
            type: 'FILE',
          },
          { content: '최종 보고서 요약', type: 'TEXT' },
        ],
        late: false,
        submittedAt: '2026-12-01T09:00:00Z',
        submittedBy: '20230001',
        version: 1,
      },
    },
    versions: {
      contents: [
        {
          late: false,
          submittedAt: '2026-12-01T09:00:00Z',
          submittedBy: '20230001',
          version: 1,
        },
      ],
    },
  },
  '1006': {
    detail: {
      canSubmitNow: false,
      currentVersion: 1,
      hasPendingReview: true,
      id: 1006,
      milestoneId: 105,
      status: 'SUBMITTED',
      teamId: 11,
      teamName: 'OOP-01 - 1팀',
    },
    versionDetails: {
      1: {
        artifacts: [
          { content: '상호 평가 응답', type: 'TEXT' },
          { type: 'CHEERPJ_RUN', url: 'https://example.com/peer-review' },
        ],
        late: true,
        submittedAt: '2026-12-15T09:00:00Z',
        submittedBy: '20230001',
        version: 1,
      },
    },
    versions: {
      contents: [
        {
          late: true,
          submittedAt: '2026-12-15T09:00:00Z',
          submittedBy: '20230001',
          version: 1,
        },
      ],
    },
  },
  '1008': {
    detail: {
      canSubmitNow: false,
      currentVersion: 1,
      hasPendingReview: false,
      id: 1008,
      milestoneId: 103,
      presentationOrder: 1,
      status: 'SUBMITTED',
      teamId: 11,
      teamName: 'OOP-01 - 1팀',
    },
    versionDetails: {
      1: {
        artifacts: [
          {
            downloadUrl: 'https://files.example.com/presentation.pdf',
            fileName: 'presentation.pdf',
            type: 'FILE',
          },
          { type: 'LINK', url: 'https://youtu.be/demo-oop-01-1' },
        ],
        late: false,
        submittedAt: '2026-11-13T09:00:00Z',
        submittedBy: '20230001',
        version: 1,
      },
    },
    versions: {
      contents: [
        {
          late: false,
          submittedAt: '2026-11-13T09:00:00Z',
          submittedBy: '20230001',
          version: 1,
        },
      ],
    },
  },
};

export function getAdminSubmissionFixture(submissionId: string) {
  return submissionFixtures[submissionId]?.detail;
}

export function getAdminSubmissionVersionsFixture(submissionId: string) {
  return submissionFixtures[submissionId]?.versions;
}

export function getAdminSubmissionVersionFixture(
  submissionId: string,
  version: number,
) {
  return submissionFixtures[submissionId]?.versionDetails[version];
}
