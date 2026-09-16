/**
 * Backend LocalDateTime (T or space separator) and date-only values use Seoul.
 * Explicit Z/offset values already identify an instant. Invalid input is NaN.
 */
export function seoulInstant(value?: string | null): number {
  if (!value) return NaN;
  const normalized = value.trim().replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized))
    return Date.parse(`${normalized}T00:00:00+09:00`);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/i.test(
      normalized,
    )
  )
    return NaN;
  return Date.parse(
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
      ? normalized
      : `${normalized}+09:00`,
  );
}
