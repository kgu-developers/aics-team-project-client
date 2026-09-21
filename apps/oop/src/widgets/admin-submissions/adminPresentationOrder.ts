import { seoulInstant } from '~/shared/lib/seoulInstant';

const EVALUATION_IMMINENT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function validatePresentationOrders(
  teams: ReadonlyArray<{ teamId: number }>,
  orders: Record<string, number | null | undefined>,
):
  | { ok: true; teamOrders: { teamId: number; order: number }[] }
  | { ok: false; error: string } {
  const teamOrders: { teamId: number; order: number }[] = [];
  for (const team of teams) {
    const order = orders[team.teamId];
    if (
      order == null ||
      !Number.isInteger(order) ||
      order < 1 ||
      order > teams.length
    ) {
      return {
        ok: false,
        error: '모든 팀의 발표 순서를 1번부터 팀 수 범위 안에서 선택해 주세요.',
      };
    }
    teamOrders.push({ teamId: team.teamId, order });
  }
  if (new Set(teamOrders.map(team => team.order)).size !== teamOrders.length) {
    return { ok: false, error: '발표 순서는 중복될 수 없습니다.' };
  }
  return { ok: true, teamOrders };
}

export function getPresentationEvaluationSetupStatus({
  criteriaCount,
  evaluationStartsAt,
  now,
  teams,
}: {
  criteriaCount: number;
  evaluationStartsAt: string | null | undefined;
  now: number;
  teams: ReadonlyArray<{
    presentationOrder: number | null;
    teamId: number;
  }>;
}) {
  const issues: string[] = [];
  if (criteriaCount < 1) issues.push('평가 항목을 1개 이상 추가해 주세요.');
  if (teams.length === 0) {
    issues.push('발표 순서를 설정할 팀이 없습니다.');
  } else {
    const orders = Object.fromEntries(
      teams.map(team => [team.teamId, team.presentationOrder]),
    );
    const orderValidation = validatePresentationOrders(teams, orders);
    if (!orderValidation.ok) issues.push(orderValidation.error);
  }

  const startsAt = seoulInstant(evaluationStartsAt);
  const urgency = Number.isNaN(startsAt)
    ? 'upcoming'
    : now >= startsAt
      ? 'started'
      : startsAt - now <= EVALUATION_IMMINENT_WINDOW_MS
        ? 'imminent'
        : 'upcoming';

  return {
    isComplete: issues.length === 0,
    issues,
    urgency,
  } as const;
}
