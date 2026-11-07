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

export function hasConfiguredPresentationOrders(
  teams: ReadonlyArray<{
    presentationOrder: number | null | undefined;
    teamId: number;
  }>,
) {
  if (teams.length === 0) return false;

  const orders = Object.fromEntries(
    teams.map(team => [team.teamId, team.presentationOrder]),
  );
  return validatePresentationOrders(teams, orders).ok;
}

/**
 * 발표 평가를 시작하기 전에 관리자 화면에서 확인할 항목입니다.
 * 평가 기간은 시작 대화상자에서 진행 시간을 입력하는 순간 생성되므로,
 * 시작 전 필수 조건에 포함하지 않습니다.
 */
export function getPresentationEvaluationStartReadiness({
  criteriaCount,
  teams,
}: {
  criteriaCount: number;
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

  return {
    isComplete: issues.length === 0,
    issues,
  } as const;
}

export function getPresentationEvaluationSetupStatus({
  criteriaCount,
  evaluationEndsAt,
  evaluationStartsAt,
  now,
  teams,
}: {
  criteriaCount: number;
  evaluationEndsAt: string | null | undefined;
  evaluationStartsAt: string | null | undefined;
  now: number;
  teams: ReadonlyArray<{
    presentationOrder: number | null;
    teamId: number;
  }>;
}) {
  const issues: string[] = [];
  const startsAt = seoulInstant(evaluationStartsAt);
  const endsAt = seoulInstant(evaluationEndsAt);
  if (Number.isNaN(startsAt) || Number.isNaN(endsAt) || startsAt >= endsAt) {
    issues.push('평가 기간을 설정해 주세요.');
  }
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
