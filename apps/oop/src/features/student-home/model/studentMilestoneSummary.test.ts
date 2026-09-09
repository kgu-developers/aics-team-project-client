import type {
  MyTeamMilestoneSubmissionResponse,
  StudentMilestoneResponse,
} from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  milestoneDate,
  milestoneTime,
  studentMilestoneSummary,
} from './studentMilestoneSummary';

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
    expect(result.status).toBe('closed');
    expect(result.statusLabel).toBe('제출 완료 · 마감');
  });
  it('제출 상태 미조회는 미제출과 구분한다', () => {
    expect(studentMilestoneSummary(milestone, undefined, now).statusLabel).toBe(
      '상태 확인 필요',
    );
  });
});

describe('마감과 팀별 제출 가능 상태', () => {
  const due = Date.parse(milestone.schedule.dueAt!);
  it('마감 직전과 정확한 마감 시각을 구분한다', () => {
    expect(studentMilestoneSummary(milestone, submission, due - 1).status).toBe(
      'in-progress',
    );
    expect(studentMilestoneSummary(milestone, submission, due).status).toBe(
      'closed',
    );
  });
  it('수정 요청이 남아 있어도 서버가 재제출을 허용하지 않으면 마감이다', () => {
    const result = studentMilestoneSummary(
      milestone,
      { ...submission, status: 'REVISION_REQUESTED' },
      due,
    );
    expect(result.status).toBe('closed');
    expect(result.statusLabel).toBe('수정 요청 · 마감');
  });
  it('서버가 재제출을 허용하면 공식 수정 기한을 표시한다', () => {
    const result = studentMilestoneSummary(
      {
        ...milestone,
        schedule: {
          ...milestone.schedule,
          revisionUntil: '2026-10-15T18:30:00+09:00',
        },
      },
      { ...submission, status: 'REVISION_REQUESTED', canSubmitNow: true },
      due,
    );
    expect(result.status).toBe('revision-available');
    expect(result.dueDate).toContain('재제출 마감');
    expect(result.dueDate).toContain('15.');
  });
  it('지각 제출 가능 기간에는 원래 마감 대신 지각 기한을 안내한다', () => {
    const result = studentMilestoneSummary(
      {
        ...milestone,
        schedule: {
          ...milestone.schedule,
          lateSubmissionUntil: '2026-10-12T18:30:00+09:00',
        },
      },
      { ...submission, canSubmitNow: true },
      due,
    );
    expect(result.status).toBe('in-progress');
    expect(result.dueDate).toContain('지각 제출 마감');
  });
  it('공식 기한 이후 교수 재오픈은 서버 값을 따르고 임의 기한을 만들지 않는다', () => {
    const result = studentMilestoneSummary(
      { ...milestone, status: 'CLOSED' },
      { ...submission, status: 'REVISION_REQUESTED', canSubmitNow: true },
      due + 1,
    );
    expect(result.status).toBe('revision-available');
    expect(result.dueDate).toBe('제출 가능 · 기한 확인 필요');
  });
  it('마감과 관계없이 COMPLETED만 단계 완료로 표시한다', () => {
    expect(
      studentMilestoneSummary(
        milestone,
        { ...submission, status: 'COMPLETED' },
        due,
      ).status,
    ).toBe('completed');
  });
  it('조회되지 않은 상태를 기간 전 또는 진행 중으로 판단하지 않는다', () => {
    expect(studentMilestoneSummary(milestone, undefined, due).status).toBe(
      'unavailable',
    );
  });
  it('오프셋 없는 서버 일정은 한국 시각으로 해석한다', () => {
    expect(milestoneTime('2026-10-10T18:30:00')).toBe(due);
    expect(milestoneDate('2026-10-10T18:30:00')).toContain('18:30');
    expect(milestoneDate(null)).toBe('일정 미정');
    expect(milestoneDate('invalid')).toBe('일정 확인 필요');
  });
});

it.each(['revisionUntil', 'lateSubmissionUntil'] as const)(
  '%s 경계에서 서버가 제출을 닫으면 마감으로 전환한다',
  field => {
    const end = '2026-10-15T18:30:00+09:00';
    const item = {
      ...milestone,
      schedule: { ...milestone.schedule, [field]: end },
    };
    const status =
      field === 'revisionUntil' ? 'REVISION_REQUESTED' : 'NOT_SUBMITTED';
    const before = studentMilestoneSummary(
      item,
      { ...submission, status, canSubmitNow: true },
      Date.parse(end) - 1,
    );
    const after = studentMilestoneSummary(
      item,
      { ...submission, status, canSubmitNow: false },
      Date.parse(end),
    );
    expect(before.status).not.toBe('closed');
    expect(after.status).toBe('closed');
  },
);
