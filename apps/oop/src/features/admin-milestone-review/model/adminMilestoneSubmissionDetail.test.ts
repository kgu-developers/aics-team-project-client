import { describe, expect, it } from 'vitest';

import {
  toAdminSubmissionDetailView,
  toAdminSubmissionVersionDetailView,
} from './adminMilestoneSubmissionDetail';

describe('toAdminSubmissionDetailView', () => {
  it('서버의 선택 필드를 화면용 null 값으로 정규화한다', () => {
    expect(
      toAdminSubmissionDetailView({
        canSubmitNow: false,
        currentVersion: 2,
        hasPendingReview: true,
        meetingRecordCount: 0,
        id: 1001,
        milestoneId: 101,
        status: 'REVISION_REQUESTED',
        teamId: 11,
        teamName: 'OOP-01 - 1팀',
      }),
    ).toMatchObject({
      completedAt: null,
      completedBy: null,
      milestoneId: '101',
      presentationOrder: null,
      statusLabel: '수정 요청',
      submissionId: '1001',
      teamId: '11',
    });
  });
});

describe('toAdminSubmissionVersionDetailView', () => {
  it('아티팩트 종류를 화면 표시용 이름으로 변환한다', () => {
    expect(
      toAdminSubmissionVersionDetailView({
        artifacts: [
          { downloadUrl: '/files/1', fileName: 'proposal.pdf', type: 'FILE' },
          { type: 'LINK', url: 'https://example.com' },
          { content: '제출 내용', type: 'TEXT' },
          { type: 'CHEERPJ_RUN', url: 'https://example.com/run' },
        ],
        late: false,
        submittedAt: '2026-09-07T09:00:00Z',
        submittedBy: '20230001',
        version: 2,
      }),
    ).toEqual(
      expect.objectContaining({
        artifacts: [
          expect.objectContaining({ label: '파일' }),
          expect.objectContaining({ label: '링크' }),
          expect.objectContaining({ label: '텍스트' }),
          expect.objectContaining({ label: 'CheerpJ 실행' }),
        ],
      }),
    );
  });

  it('같은 파일명이 여러 제출 규칙에 연결되어도 고유한 렌더링 식별자를 만든다', () => {
    const view = toAdminSubmissionVersionDetailView({
      artifacts: [
        {
          downloadUrl: '/files/11',
          fileId: 11,
          fileName: 'e2e-submission.pdf',
          requiredArtifactId: 21,
          type: 'FILE',
        },
        {
          downloadUrl: '/files/11',
          fileId: 11,
          fileName: 'e2e-submission.pdf',
          requiredArtifactId: 22,
          type: 'FILE',
        },
      ],
      late: false,
      submittedAt: '2026-09-07T09:00:00Z',
      submittedBy: '20230001',
      version: 1,
    });

    expect(view.artifacts.map(artifact => artifact.identityKey)).toEqual([
      'FILE:21:11:e2e-submission.pdf:0',
      'FILE:22:11:e2e-submission.pdf:1',
    ]);
    expect(
      new Set(view.artifacts.map(artifact => artifact.identityKey)).size,
    ).toBe(2);
  });
});
