import type {
  MyTeamMilestoneSubmissionResponse,
  StudentMilestoneResponse,
} from '@aics/core';
import { describe, expect, it } from 'vitest';

import { studentMilestoneSummary } from './studentMilestoneSummary';

const milestone: StudentMilestoneResponse = {
  id: 47,
  sectionId: 2,
  type: 'PROPOSAL',
  title: '우리 분반 제안서',
  status: 'PUBLISHED',
  weekNumber: 3,
  allowResubmissionBeforeDueAt: false,
  schedule: {
    opensAt: '2026-10-01T00:00:00+09:00',
    dueAt: '2026-10-10T18:30:00+09:00',
  },
};
const submission: MyTeamMilestoneSubmissionResponse = {
  id: 99,
  milestoneId: 47,
  teamId: 7,
  status: 'NOT_SUBMITTED',
  currentVersion: 0,
  canSubmitNow: false,
  hasPendingReview: false,
};
const now = Date.parse('2026-09-01T00:00:00+09:00');
describe('학생 홈 마일스톤 표시', () => {
  it('공개된 미제출 단계는 시작 전까지 기간 전으로 표시한다', () => {
    const result = studentMilestoneSummary(milestone, submission, now);
    expect(result.status).toBe('before-period');
    expect(result.statusLabel).toBe('기간 전');
  });
  it('시작 시각부터 미제출 상태를 표시한다', () => {
    const result = studentMilestoneSummary(
      milestone,
      submission,
      Date.parse(milestone.schedule.opensAt!),
    );
    expect(result.status).toBe('in-progress');
    expect(result.statusLabel).toBe('미제출');
  });
  it('시작 전에도 이미 제출한 결과는 기간 전으로 숨기지 않는다', () => {
    const result = studentMilestoneSummary(
      milestone,
      { ...submission, status: 'SUBMITTED' },
      now,
    );
    expect(result.status).toBe('in-progress');
    expect(result.statusLabel).toBe('제출 완료');
  });
  it('서버 ID와 제목을 유지하고 마감 시각을 자정으로 바꾸지 않는다', () => {
    const result = studentMilestoneSummary(milestone, submission, now);
    expect(result.id).toBe('47');
    expect(result.title).toBe('우리 분반 제안서');
    expect(result.dueDate).toContain('18:30');
  });
  it('조기 제출 가능 여부는 일정 추정 대신 서버 값을 따른다', () => {
    const result = studentMilestoneSummary(
      milestone,
      { ...submission, canSubmitNow: true },
      now,
    );
    expect(result.status).toBe('in-progress');
    expect(result.statusLabel).toBe('미제출');
    expect(result.isDetailAvailable).toBe(false);
    expect(result.rows).toEqual([]);
  });
  it('마일스톤 CLOSED와 제출 SUBMITTED를 단계 완료로 바꾸지 않는다', () => {
    const result = studentMilestoneSummary(
      { ...milestone, status: 'CLOSED' },
      { ...submission, status: 'SUBMITTED' },
      now,
    );
    expect(result.status).not.toBe('completed');
    expect(result.statusLabel).toBe('제출 완료');
  });
  it('제출 상태 미조회는 미제출과 구분한다', () => {
    expect(studentMilestoneSummary(milestone, undefined, now).statusLabel).toBe(
      '상태 확인 필요',
    );
  });
});
