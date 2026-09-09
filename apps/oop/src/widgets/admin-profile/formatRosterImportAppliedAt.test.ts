import { describe, expect, it } from 'vitest';

import { formatRosterImportAppliedAt } from './formatRosterImportAppliedAt';

describe('formatRosterImportAppliedAt', () => {
  it('시간대가 없는 서버 UTC 시각을 한국 시간으로 표시한다', () => {
    expect(formatRosterImportAppliedAt('2026-09-09T07:00:00')).toMatch(
      /오후 4:00/,
    );
  });

  it('시간대가 포함된 ISO 시각은 그대로 한국 시간으로 변환한다', () => {
    expect(formatRosterImportAppliedAt('2026-09-09T07:00:00Z')).toMatch(
      /오후 4:00/,
    );
  });
});
