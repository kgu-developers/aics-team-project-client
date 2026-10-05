import { describe, expect, it } from 'vitest';

import { formatAdminMeetingDateTime } from './formatAdminMeetingDateTime';

describe('formatAdminMeetingDateTime', () => {
  it.each(['2026-10-01 09:00', '2026-10-01T09:00:30'])(
    '%s 로 내려온 관리자 회의록 로컬 시각을 그대로 표시한다',
    value => {
      expect(formatAdminMeetingDateTime(value)).toBe('2026-10-01/09:00');
    },
  );

  it('오프셋이 있는 시각은 서울 시각으로 변환한다', () => {
    expect(formatAdminMeetingDateTime('2026-10-01T00:00:00Z')).toBe(
      '2026-10-01/09:00',
    );
  });
});
