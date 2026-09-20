import { describe, expect, it } from 'vitest';

import {
  formatAdminMilestoneDate,
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

  it('오프셋 없는 서버 시각은 UTC로 보정하고 명시된 UTC 시각은 중복 보정하지 않는다', () => {
    expect(formatAdminMilestoneDate('2026-09-30T10:10:00')).toBe(
      '2026-09-30/19:10',
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
});
