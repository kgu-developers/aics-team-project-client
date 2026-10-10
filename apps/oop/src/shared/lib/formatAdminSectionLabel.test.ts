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
});
