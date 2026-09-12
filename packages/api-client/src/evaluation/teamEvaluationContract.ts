import type { MyTeamEvaluationsResponse, TeamEvaluationDto } from '@aics/core';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const positiveId = (value: unknown) =>
  Number.isSafeInteger(value) && Number(value) > 0;
const windowStates = ['UNAVAILABLE', 'UPCOMING', 'OPEN', 'CLOSED'];
const nullableString = (value: unknown) =>
  value == null || typeof value === 'string';

function parseScores(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every(
      score =>
        record(score) &&
        positiveId(score.criterionId) &&
        Number.isSafeInteger(score.score) &&
        Number(score.score) >= 0,
    )
  );
}

export function parseTeamEvaluation(value: unknown): TeamEvaluationDto {
  if (
    !record(value) ||
    !positiveId(value.id) ||
    !positiveId(value.teamId) ||
    !parseScores(value.scores) ||
    !nullableString(value.submittedAt)
  )
    throw new Error('발표 평가 응답을 확인할 수 없어요.');
  return value as TeamEvaluationDto;
}

export function parseMyTeamEvaluations(
  value: unknown,
): MyTeamEvaluationsResponse {
  if (
    !record(value) ||
    !positiveId(value.milestoneId) ||
    !windowStates.includes(String(value.windowState)) ||
    !nullableString(value.evaluationOpensAt) ||
    !nullableString(value.evaluationClosesAt) ||
    !Array.isArray(value.criteria) ||
    !value.criteria.every(
      criterion =>
        record(criterion) &&
        positiveId(criterion.id) &&
        typeof criterion.title === 'string' &&
        Number.isSafeInteger(criterion.maxScore) &&
        Number(criterion.maxScore) > 0 &&
        Number.isSafeInteger(criterion.displayOrder),
    ) ||
    !Array.isArray(value.evaluations)
  )
    throw new Error('발표 평가 목록을 확인할 수 없어요.');
  value.evaluations.forEach(parseTeamEvaluation);
  return value as MyTeamEvaluationsResponse;
}
