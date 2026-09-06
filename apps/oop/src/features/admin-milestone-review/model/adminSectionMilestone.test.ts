import { describe, expect, it } from 'vitest';

import {
  formatAdminMilestoneDate,
  getAdminMilestoneStatusLabel,
  getAdminMilestoneTypeLabel,
} from './adminSectionMilestone';

describe('adminSectionMilestone', () => {
  it('계약된 마일스톤 유형을 관리자 표시명으로 변환한다', () => {
    expect(getAdminMilestoneTypeLabel('PRESENTATION')).toBe('발표 평가');
    expect(getAdminMilestoneTypeLabel('GENERAL')).toBe('일반');
  });

  it('일정이 없거나 유효하지 않으면 대시를 표시한다', () => {
    expect(formatAdminMilestoneDate(undefined)).toBe('-');
    expect(formatAdminMilestoneDate('not-a-date')).toBe('-');
  });

  it('마일스톤 상태를 관리자 표시명으로 변환한다', () => {
    expect(getAdminMilestoneStatusLabel('DRAFT')).toBe('미공개');
    expect(getAdminMilestoneStatusLabel('PUBLISHED')).toBe('공개');
    expect(getAdminMilestoneStatusLabel('CLOSED')).toBe('마감');
  });
});
