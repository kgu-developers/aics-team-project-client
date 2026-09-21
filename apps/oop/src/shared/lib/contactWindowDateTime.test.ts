import { describe, expect, it } from 'vitest';

import {
  contactWindowInstant,
  toContactWindowFormDateTime,
  toContactWindowServerDateTime,
} from './contactWindowDateTime';

describe('contact window date-time contract', () => {
  it('interprets backend LocalDateTime values as UTC', () => {
    expect(contactWindowInstant('2026-09-21T00:00:00')).toBe(
      Date.parse('2026-09-21T00:00:00Z'),
    );
    expect(contactWindowInstant('2026-09-21T09:00:00+09:00')).toBe(
      Date.parse('2026-09-21T00:00:00Z'),
    );
  });

  it('round-trips a Seoul admin input through the UTC server value', () => {
    const serverValue = toContactWindowServerDateTime('2026-09-21T09:00:00');

    expect(serverValue).toBe('2026-09-21T00:00:00');
    expect(toContactWindowFormDateTime(serverValue)).toBe(
      '2026-09-21T09:00:00',
    );
  });

  it('rejects malformed values without silently opening a contact window', () => {
    expect(contactWindowInstant('2026-09-21')).toBeNaN();
    expect(contactWindowInstant('invalid')).toBeNaN();
  });
});
