const presentationEvaluationDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(?:(Z)|([+-]\d{2}:?\d{2}))?$/i;

function normalizePresentationEvaluationDateTime(value?: string | null) {
  return value?.trim().replace(' ', 'T') ?? '';
}

function isValidPresentationEvaluationDateTime(value: string) {
  const match = presentationEvaluationDateTimePattern.exec(value);
  if (!match) return false;

  const [, year, month, day, hour, minute, second = '0'] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );

  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day) &&
    date.getUTCHours() === Number(hour) &&
    date.getUTCMinutes() === Number(minute) &&
    date.getUTCSeconds() === Number(second)
  );
}

function hasExplicitPresentationEvaluationZone(value: string) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
}

/** Resolves a presentation-evaluation server value to its actual instant. */
export function presentationEvaluationInstant(value?: string | null): number {
  const normalized = normalizePresentationEvaluationDateTime(value);
  if (!isValidPresentationEvaluationDateTime(normalized)) return NaN;

  return Date.parse(
    hasExplicitPresentationEvaluationZone(normalized)
      ? normalized
      : `${normalized}Z`,
  );
}

/** Converts a Seoul admin wall clock to the presentation server contract. */
export function toPresentationEvaluationServerDateTime(
  value: string,
): string | undefined {
  const normalized = normalizePresentationEvaluationDateTime(value);
  if (!isValidPresentationEvaluationDateTime(normalized)) return undefined;

  const instant = Date.parse(
    hasExplicitPresentationEvaluationZone(normalized)
      ? normalized
      : `${normalized}+09:00`,
  );
  if (!Number.isFinite(instant)) return undefined;

  return new Date(instant).toISOString().slice(0, 19);
}

/**
 * Converts a milestone bound to the Seoul wall clock used to validate a
 * presentation-evaluation window. Invalid bounds remain unusable.
 */
export function toPresentationEvaluationPrerequisiteDateTime(
  value?: string | null,
): string | undefined {
  const normalized = normalizePresentationEvaluationDateTime(value);
  if (!isValidPresentationEvaluationDateTime(normalized)) return undefined;

  const instant = Date.parse(
    hasExplicitPresentationEvaluationZone(normalized)
      ? normalized
      : `${normalized}+09:00`,
  );
  if (!Number.isFinite(instant)) return undefined;

  return new Date(instant + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/** Converts a presentation server value to a Seoul admin wall clock. */
export function toPresentationEvaluationSeoulDateTimeInput(
  value?: string | null,
): string | undefined {
  const instant = presentationEvaluationInstant(value);
  if (!Number.isFinite(instant)) return undefined;

  return new Date(instant + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

/** Formats a presentation server value in the Seoul course timezone. */
export function formatPresentationEvaluationDateTime(
  value?: string | null,
): string | undefined {
  const dateTime = toPresentationEvaluationSeoulDateTimeInput(value);
  return dateTime
    ? `${dateTime.slice(0, 10)}/${dateTime.slice(11, 16)}`
    : undefined;
}
