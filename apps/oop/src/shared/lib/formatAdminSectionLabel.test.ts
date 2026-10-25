import { describe, expect, it } from 'vitest';

import { formatAdminSectionLabel } from './formatAdminSectionLabel';

describe('formatAdminSectionLabel', () => {
  it('분반 코드와 이미 조회된 수업 시간을 함께 표시한다', () => {
    expect(
      formatAdminSectionLabel({
        classTime: '월요일 1-2교시',
        code: 'TEST-01',
      }),
    ).toBe('TEST-01 · 월요일 1-2교시');
  });

  it('수업 시간이 없으면 분반 코드만 표시한다', () => {
    expect(formatAdminSectionLabel({ classTime: '', code: 'TEST-01' })).toBe(
      'TEST-01',
    );
  });

  it('수업 시간 뒤에 함께 내려오는 중복 분반명은 표시하지 않는다', () => {
    expect(
      formatAdminSectionLabel({ classTime: '월6/1152', code: '1152' }),
    ).toBe('1152 · 월6');
  });

  it('수업 시간 자체에 포함된 슬래시는 유지한다', () => {
    expect(
      formatAdminSectionLabel({ classTime: '월/수', code: 'TEST-01' }),
    ).toBe('TEST-01 · 월/수');
  });
});
