import { describe, expect, it } from 'vitest';

import {
  contactWindowInstant,
  toContactWindowFormDateTime,
  toContactWindowServerDateTime,
} from './contactWindowDateTime';

describe('contact window date-time contract', () => {
  it.each([
    '2026-10-24T03:00:00',
    '2026-10-24 03:00:00',
    '2026-10-24T03:00:00+09:00',
    '2026-10-23T18:00:00Z',
  ])('interprets %s as the same Seoul instant', value => {
    expect(contactWindowInstant(value)).toBe(
      Date.parse('2026-10-23T18:00:00Z'),
    );
    expect(toContactWindowFormDateTime(value)).toBe('2026-10-24T03:00:00');
    expect(toContactWindowServerDateTime(value)).toBe('2026-10-24T03:00:00');
  });

  it.each([
    '2026-10-24T00:00:00',
    '2026-10-24T03:00:00',
    '2026-10-24T18:00:00',
  ])(
    'preserves admin input %s through save and reopen without shifting the date',
    input => {
      const serverValue = toContactWindowServerDateTime(input);
      expect(serverValue).toBe(input);
      expect(toContactWindowFormDateTime(serverValue)).toBe(input);
    },
  );

  it.each([
    '2026-09-21',
    'invalid',
    '2026-02-30T12:00:00',
    '',
    null,
    undefined,
  ])('rejects %s without silently opening a contact window', value => {
    expect(contactWindowInstant(value)).toBeNaN();
  });
});
