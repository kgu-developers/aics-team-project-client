import { describe, expect, it } from 'vitest';

import { formatCourseScheduleDateTime } from './formatCourseScheduleDateTime';

describe('formatCourseScheduleDateTime', () => {
  it('오프셋 없는 수업 일정은 서울 현지 시각 그대로 표시한다', () => {
    expect(formatCourseScheduleDateTime('2026-09-17T23:59:00')).toBe(
      '2026-09-17/23:59',
    );
  });

  it('명시된 UTC·오프셋 일정도 같은 서울 시각으로 표시한다', () => {
    expect(formatCourseScheduleDateTime('2026-09-17T14:59:00Z')).toBe(
      '2026-09-17/23:59',
    );
    expect(formatCourseScheduleDateTime('2026-09-17T23:59:00+09:00')).toBe(
      '2026-09-17/23:59',
    );
  });
});
