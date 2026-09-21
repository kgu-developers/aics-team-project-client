const seoulDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?:(Z)|([+-]\d{2}:?\d{2}))?)?$/i;

/**
 * Backend LocalDateTime (T or space separator) and date-only values use Seoul.
 * Explicit Z/offset values already identify an instant. Invalid input is NaN.
 */
export function seoulInstant(value?: string | null): number {
  if (!value) return NaN;
  const normalized = value.trim().replace(' ', 'T');
  const match = seoulDateTimePattern.exec(normalized);
  if (!match) return NaN;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  const calendarValue = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
  if (
    calendarValue.getUTCFullYear() !== Number(year) ||
    calendarValue.getUTCMonth() !== Number(month) - 1 ||
    calendarValue.getUTCDate() !== Number(day) ||
    calendarValue.getUTCHours() !== Number(hour) ||
    calendarValue.getUTCMinutes() !== Number(minute) ||
    calendarValue.getUTCSeconds() !== Number(second)
  )
    return NaN;

  if (!match[4]) return Date.parse(`${normalized}T00:00:00+09:00`);
  return Date.parse(
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
      ? normalized
      : `${normalized}+09:00`,
  );
}
