import { describe, expect, it } from 'vitest';

import { getCurrentMidReport } from './midReport';
import { getCurrentPresentation } from './presentation';
import {
  createStudentHomeDashboardPreview,
  createStudentHomeDashboardWithMidReportProgress,
  createStudentHomeDashboardWithPresentationProgress,
  studentHomeDashboardFixture,
} from './studentHome';

describe('student home document progress', () => {
  it('기간 전 중간보고서와 발표 문서의 접근 제한을 진행률로 덮어쓰지 않는다', () => {
    const dashboard = createStudentHomeDashboardWithPresentationProgress(
      createStudentHomeDashboardWithMidReportProgress(
        studentHomeDashboardFixture,
        getCurrentMidReport(),
      ),
      getCurrentPresentation(),
    );
    const midReportRow = dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    )?.rows[0];
    const presentationRow = dashboard.milestones.find(
      milestone => milestone.id === 'presentation',
    )?.rows[0];

    expect(midReportRow).toMatchObject({
      actionDisabled: true,
      actionLabel: '기간 전',
      actionNotice: '제안서를 제출하면 이 팀에 한해 조기 활성화될 수 있어요.',
    });
    expect(midReportRow?.actionTo).toBeUndefined();
    expect(presentationRow).toMatchObject({
      actionDisabled: true,
      actionLabel: '기간 전',
    });
    expect(presentationRow?.actionTo).toBeUndefined();
  });

  it('작성 기간에는 진행률을 합성해도 실제 에디터 경로가 있는 CTA만 활성화한다', () => {
    const dashboard = createStudentHomeDashboardWithMidReportProgress(
      createStudentHomeDashboardPreview('mid-report'),
      getCurrentMidReport(),
    );
    const row = dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    )?.rows[0];

    expect(row).toMatchObject({
      actionDisabled: false,
      actionLabel: '작성하기',
      actionTo: '/student/editor/mid-review/topic',
    });
  });
});
