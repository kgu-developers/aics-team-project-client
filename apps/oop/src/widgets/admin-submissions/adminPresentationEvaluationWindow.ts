import { seoulInstant } from '~/shared/lib/seoulInstant';

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

export const MAX_EVALUATION_DURATION_MINUTES = 24 * 60;

/** Serializes an instant for the server's LocalDateTime contract in Asia/Seoul. */
export function formatSeoulDateTimeWithoutOffset(instant: number) {
  return new Date(instant + SEOUL_OFFSET_MS).toISOString().slice(0, 19);
}

export function isValidEvaluationDurationMinutes(
  durationMinutes: number | null | undefined,
): durationMinutes is number {
  return (
    typeof durationMinutes === 'number' &&
    Number.isInteger(durationMinutes) &&
    durationMinutes >= 1 &&
    durationMinutes <= MAX_EVALUATION_DURATION_MINUTES
  );
}

/** Converts a server timestamp to the offset-free Seoul LocalDateTime PATCH contract. */
export function normalizeEvaluationOpensAt(evaluationOpensAt: string) {
  const instant = seoulInstant(evaluationOpensAt);
  return Number.isFinite(instant)
    ? formatSeoulDateTimeWithoutOffset(instant)
    : null;
}

export function createEvaluationWindowFromNow(
  durationMinutes: number,
  now = Date.now(),
) {
  const startsAt = formatSeoulDateTimeWithoutOffset(now);

  return {
    evaluationClosesAt: formatSeoulDateTimeWithoutOffset(
      now + durationMinutes * 60 * 1000,
    ),
    evaluationOpensAt: startsAt,
  };
}

export function createEvaluationResumeWindow(
  evaluationOpensAt: string,
  durationMinutes: number,
  now = Date.now(),
) {
  return {
    evaluationClosesAt: formatSeoulDateTimeWithoutOffset(
      now + durationMinutes * 60 * 1000,
    ),
    evaluationOpensAt,
  };
}
