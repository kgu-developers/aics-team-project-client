import type { Submission } from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  createStudentHomeDashboardPreview,
  createStudentHomeDashboardWithFinalReportSubmission,
  createStudentHomeDashboardWithPresentationSubmission,
} from './studentHome';

const submittedFinalReport: Submission = {
  id: 'submission-final-report',
  sectionId: 'oop-2026-2-01',
  milestoneId: 'final-report',
  milestoneKind: 'FINAL_REPORT',
  milestoneTitle: '최종보고서',
  teamId: 'team-07',
  teamName: 'CineFlow (7팀)',
  status: 'SUBMITTED',
  canSubmitNow: true,
  artifactRules: [
    {
      key: 'FINAL_REPORT_PDF',
      label: '최종보고서 PDF',
      required: true,
      allowedExtensions: ['pdf'],
      maxSize: 20 * 1024 * 1024,
    },
    {
      key: 'SOURCE_CODE_ZIP',
      label: '최종 소스코드 ZIP',
      required: true,
      allowedExtensions: ['zip'],
      maxSize: 50 * 1024 * 1024,
    },
  ],
  currentVersion: {
    id: 'submission-final-report-v1',
    versionNumber: 1,
    description: '',
    submittedAt: '2026-12-07T12:00:00+09:00',
    updatedAt: '2026-12-07T13:00:00+09:00',
    submittedBy: { userId: 'student-a', name: '서진규' },
    artifacts: [
      {
        id: 'final-pdf',
        kind: 'FILE',
        name: 'final-report.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      },
      {
        id: 'source-zip',
        kind: 'FILE',
        name: 'source.zip',
        size: 2048,
        mimeType: 'application/zip',
      },
    ],
  },
  memberConsent: {
    confirmedCount: 5,
    totalCount: 5,
    isConfirmedByMe: true,
  },
  versions: [],
};

describe('createStudentHomeDashboardWithFinalReportSubmission', () => {
  it('제출 뒤 단계는 진행 중으로 유지하고 제출 행과 파일 목록만 갱신한다', () => {
    const dashboard = createStudentHomeDashboardWithFinalReportSubmission(
      createStudentHomeDashboardPreview('final-report'),
      submittedFinalReport,
    );
    const milestone = dashboard.milestones.find(
      item => item.id === 'final-report',
    );

    expect(milestone).toMatchObject({
      currentStepLabel: '최종보고서 제출',
      status: 'in-progress',
      statusLabel: '기간 중',
    });
    expect(milestone?.rows[0]).toMatchObject({
      actionLabel: '파일 교체',
      value: '제출 완료',
    });
    expect(milestone?.body).toMatchObject({
      kind: 'final-report',
      submissionId: 'submission-final-report',
      materials: [
        expect.objectContaining({
          label: '최종보고서 PDF',
          value: 'final-report.pdf',
        }),
        expect.objectContaining({
          label: '최종 소스코드 ZIP',
          value: 'source.zip',
        }),
      ],
      memberConsent: {
        confirmedCount: 5,
        totalCount: 5,
        isConfirmedByMe: true,
      },
      submission: {
        submittedBy: '서진규',
        submittedAt: '2026-12-07T12:00:00+09:00',
        updatedAt: '2026-12-07T13:00:00+09:00',
      },
    });
  });

  it('발표 자료를 제출하기 전에도 필수 URL과 파일 슬롯을 제공한다', () => {
    const submission: Submission = {
      id: 'submission-presentation',
      sectionId: 'oop-2026-2-01',
      milestoneId: 'presentation',
      milestoneKind: 'PRESENTATION',
      milestoneTitle: '발표 자료',
      teamId: 'team-07',
      teamName: 'CineFlow (7팀)',
      status: 'NOT_SUBMITTED',
      canSubmitNow: true,
      artifactRules: [
        {
          key: 'PRESENTATION_PDF',
          label: '발표 자료 PDF',
          required: true,
          allowedExtensions: ['pdf'],
          maxSize: 20 * 1024 * 1024,
        },
        {
          key: 'SOURCE_CODE_ZIP',
          label: '실행 소스 ZIP',
          required: true,
          allowedExtensions: ['zip'],
          maxSize: 50 * 1024 * 1024,
        },
      ],
      linkRules: [
        {
          key: 'PRESENTATION_DEMO_URL',
          label: '시연 URL',
          required: true,
          allowedProtocols: ['http:', 'https:'],
        },
      ],
      currentVersion: null,
      versions: [],
    };

    const dashboard = createStudentHomeDashboardWithPresentationSubmission(
      createStudentHomeDashboardPreview('presentation-material'),
      submission,
    );
    const milestone = dashboard.milestones.find(
      item => item.id === 'presentation',
    );

    expect(milestone?.body).toMatchObject({
      kind: 'presentation-material',
      materials: [
        { label: '시연 URL', value: undefined },
        { label: '발표 자료 PDF', value: undefined },
        { label: '실행 소스 ZIP', value: undefined },
      ],
      submission: undefined,
    });
  });

  it('팀원에게는 파일 제출 대신 승인 CTA를 제공한다', () => {
    const memberSubmission: Submission = {
      ...submittedFinalReport,
      memberConsent: {
        confirmedCount: 4,
        totalCount: 5,
        isConfirmedByMe: false,
      },
    };
    const dashboard = createStudentHomeDashboardWithFinalReportSubmission(
      createStudentHomeDashboardPreview('final-report'),
      memberSubmission,
      false,
    );
    const milestone = dashboard.milestones.find(
      item => item.id === 'final-report',
    );

    expect(milestone?.rows[0]).toMatchObject({
      label: '최종보고서 승인',
      actionLabel: '승인하기',
      actionDisabled: false,
      value: '팀원 승인 4/5',
    });
    expect(milestone?.currentStepLabel).toBe('최종보고서 승인');
  });

  it('지난 기간의 제안서 행은 다음 발표 단계에서 후보 등록 CTA를 노출하지 않는다', () => {
    const dashboard = createStudentHomeDashboardPreview(
      'presentation-material',
    );
    const proposal = dashboard.milestones.find(item => item.id === 'proposal');

    expect(proposal).toMatchObject({
      status: 'completed',
      statusLabel: '완료',
    });
    expect(proposal?.rows[0]).toMatchObject({
      value: '완료',
      actionLabel: undefined,
    });
  });
});
