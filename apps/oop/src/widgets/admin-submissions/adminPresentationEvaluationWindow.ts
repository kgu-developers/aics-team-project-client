const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Serializes an instant for the server's LocalDateTime contract in Asia/Seoul. */
export function formatSeoulDateTimeWithoutOffset(instant: number) {
  return new Date(instant + SEOUL_OFFSET_MS).toISOString().slice(0, 19);
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

export function createEvaluationEndWindow(evaluationOpensAt: string) {
  return {
    evaluationClosesAt: formatSeoulDateTimeWithoutOffset(Date.now()),
    evaluationOpensAt,
  };
}
