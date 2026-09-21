import { describe, expect, it } from 'vitest';

import {
  formatAdminMilestoneDate,
  formatAdminPresentationEvaluationDate,
  getAdminMilestoneStatusLabel,
  getAdminMilestoneTypeLabel,
} from './adminSectionMilestone';

describe('adminSectionMilestone', () => {
  it('계약된 마일스톤 유형을 관리자 표시명으로 변환한다', () => {
    expect(getAdminMilestoneTypeLabel('PRESENTATION')).toBe('발표');
    expect(getAdminMilestoneTypeLabel('GENERAL')).toBe('일반');
  });

  it('일정이 없거나 유효하지 않으면 대시를 표시한다', () => {
    expect(formatAdminMilestoneDate(undefined)).toBe('-');
    expect(formatAdminMilestoneDate('not-a-date')).toBe('-');
  });

  it('오프셋 없는 일정과 명시된 UTC 일정을 같은 서울 경계로 표시한다', () => {
    expect(formatAdminMilestoneDate('2026-09-30T10:10:00')).toBe(
      '2026-09-30/10:10',
    );
    expect(formatAdminMilestoneDate('2026-09-30T01:10:00Z')).toBe(
      '2026-09-30/10:10',
    );
  });

  it('마일스톤 상태를 관리자 표시명으로 변환한다', () => {
    expect(getAdminMilestoneStatusLabel('DRAFT')).toBe('미공개');
    expect(getAdminMilestoneStatusLabel('PUBLISHED')).toBe('공개');
    expect(getAdminMilestoneStatusLabel('CLOSED')).toBe('마감');
  });

  it('발표 평가의 오프셋 없는 LocalDateTime을 서울 벽시각 그대로 표시한다', () => {
    expect(formatAdminPresentationEvaluationDate('2026-09-21T09:00:00')).toBe(
      '2026-09-21/09:00',
    );
    expect(formatAdminPresentationEvaluationDate('2026-09-21T09:00:00Z')).toBe(
      '2026-09-21/18:00',
    );
    expect(formatAdminPresentationEvaluationDate('invalid')).toBe('-');
  });
});
