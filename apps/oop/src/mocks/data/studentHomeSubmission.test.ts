import type { Submission } from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  createStudentHomeDashboardPreview,
  createStudentHomeDashboardWithFinalReportSubmission,
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
  artifactRules: [],
  currentVersion: {
    id: 'submission-final-report-v1',
    versionNumber: 1,
    description: '',
    submittedAt: '2026-12-07T12:00:00+09:00',
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
      submittedFiles: [
        expect.objectContaining({ name: 'final-report.pdf' }),
        expect.objectContaining({ name: 'source.zip' }),
      ],
    });
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
