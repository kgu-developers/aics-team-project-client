import { describe, expect, it } from 'vitest';

import {
  formatAdminTotalMeetingRecordCount,
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
          status: 'SUBMITTED',
          teamId: 1,
          teamName: 'OOP-01 - 1팀',
          totalMeetingRecordCount: 5,
        },
      ],
    });

    expect(view.submissions[0]?.totalMeetingRecordCount).toBe(5);
    expect(formatAdminTotalMeetingRecordCount(5)).toBe('팀 전체 회의록 5건');
    expect(hasAdminTotalMeetingRecords(5)).toBe(true);
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

  it('전체 회의록 수가 0이면 목록 이동 대상으로 만들지 않는다', () => {
    expect(formatAdminTotalMeetingRecordCount(0)).toBe('팀 전체 회의록 0건');
    expect(hasAdminTotalMeetingRecords(0)).toBe(false);
  });
});
