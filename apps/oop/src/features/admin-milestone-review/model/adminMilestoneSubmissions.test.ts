import { describe, expect, it } from 'vitest';

import {
  formatAdminTotalMeetingRecordCount,
  getAdminMilestoneReviewStatus,
  hasAdminTotalMeetingRecords,
  toAdminMilestoneSubmissionsView,
} from './adminMilestoneSubmissions';

describe('toAdminMilestoneSubmissionsView', () => {
  it('팀 전체 회의록 수를 마일스톤 연결 회의록 수와 분리해 보존한다', () => {
    const view = toAdminMilestoneSubmissionsView({
      contents: [
        {
          canSubmitNow: false,
          currentVersion: 1,
          hasPendingReview: false,
          id: 1001,
          meetingRecordCount: 1,
          milestoneId: 101,
          projectId: 42,
          status: 'SUBMITTED',
          teamId: 1,
          teamName: 'OOP-01 - 1팀',
          totalMeetingRecordCount: 5,
        },
      ],
    });

    expect(view.submissions[0]?.totalMeetingRecordCount).toBe(5);
    expect(view.submissions[0]?.projectId).toBe('42');
    expect(formatAdminTotalMeetingRecordCount(5)).toBe('팀 전체 회의록 5건');
    expect(hasAdminTotalMeetingRecords(5)).toBe(true);
  });

  it('중간보고서 문서 식별자가 있으면 현재 상태가 미제출이어도 상세 ID를 유지한다', () => {
    const view = toAdminMilestoneSubmissionsView({
      contents: [
        {
          canSubmitNow: true,
          currentVersion: 0,
          hasPendingReview: false,
          id: 1003,
          meetingRecordCount: 0,
          midReportId: 401,
          milestoneId: 102,
          status: 'NOT_SUBMITTED',
          teamId: 1,
          teamName: 'OOP-01 - 1팀',
        },
      ],
    });

    expect(view.submissions[0]).toMatchObject({
      midReportId: '401',
      submissionId: '1003',
    });
  });

  it('최초 미제출 행은 존재하지 않는 상세 ID를 만들지 않는다', () => {
    const view = toAdminMilestoneSubmissionsView({
      contents: [
        {
          canSubmitNow: true,
          currentVersion: 0,
          hasPendingReview: false,
          id: 1004,
          meetingRecordCount: 0,
          milestoneId: 102,
          status: 'NOT_SUBMITTED',
          teamId: 2,
          teamName: 'OOP-01 - 2팀',
        },
      ],
    });

    expect(view.submissions[0]?.submissionId).toBeNull();
  });

  it('새 필드가 아직 배포되지 않은 응답을 전체 회의록 0건으로 오해하지 않는다', () => {
    const view = toAdminMilestoneSubmissionsView({
      contents: [
        {
          canSubmitNow: false,
          currentVersion: 1,
          hasPendingReview: false,
          id: 1001,
          meetingRecordCount: 1,
          milestoneId: 101,
          status: 'SUBMITTED',
          teamId: 1,
          teamName: 'OOP-01 - 1팀',
        },
      ],
    });

    expect(view.submissions[0]?.totalMeetingRecordCount).toBeNull();
    expect(formatAdminTotalMeetingRecordCount(null)).toBe(
      '팀 전체 회의록 수 확인 불가',
    );
    expect(hasAdminTotalMeetingRecords(null)).toBe(false);
  });

  it('미제출 상태로 내려와도 이전 제출 버전이 있으면 상세 조회 ID를 유지한다', () => {
    const view = toAdminMilestoneSubmissionsView({
      contents: [
        {
          canSubmitNow: true,
          currentVersion: 2,
          hasPendingReview: true,
          id: 1001,
          meetingRecordCount: 1,
          milestoneId: 101,
          status: 'NOT_SUBMITTED',
          teamId: 1,
          teamName: 'OOP-01 - 1팀',
        },
      ],
    });

    expect(view.submissions[0]).toMatchObject({
      currentVersion: 2,
      status: 'NOT_SUBMITTED',
      statusLabel: '수정 요청',
      submissionId: '1001',
    });
  });

  it('미제출 상태여도 교수 검토 대기 중이면 상세 조회 ID를 유지한다', () => {
    const view = toAdminMilestoneSubmissionsView({
      contents: [
        {
          canSubmitNow: false,
          currentVersion: 0,
          feedbackRequested: true,
          hasPendingReview: false,
          id: 1002,
          meetingRecordCount: 0,
          milestoneId: 102,
          status: 'NOT_SUBMITTED',
          teamId: 2,
          teamName: 'OOP-01 - 2팀',
        },
      ],
    });

    expect(view.submissions[0]).toMatchObject({
      statusLabel: '검토 대기 중',
      submissionId: '1002',
    });
  });

  it('전체 회의록 수가 0이면 목록 이동 대상으로 만들지 않는다', () => {
    expect(formatAdminTotalMeetingRecordCount(0)).toBe('팀 전체 회의록 0건');
    expect(hasAdminTotalMeetingRecords(0)).toBe(false);
  });

  it('수정 요청 중에는 검토 대기 상태보다 수정 요청을 우선 표시한다', () => {
    expect(
      getAdminMilestoneReviewStatus({
        feedbackRequested: true,
        hasPendingReview: true,
      }),
    ).toBe('수정 요청');

    expect(
      getAdminMilestoneReviewStatus({
        feedbackRequested: true,
        hasPendingReview: false,
      }),
    ).toBe('검토 대기 중');
  });
});
