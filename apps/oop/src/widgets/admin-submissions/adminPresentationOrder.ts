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
