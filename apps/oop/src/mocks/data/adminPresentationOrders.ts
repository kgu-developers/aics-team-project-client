const ordersByMilestone = new Map<string, Map<number, number>>();

export function getAdminPresentationOrderFixture(
  milestoneId: string,
  teamId: number,
) {
  return ordersByMilestone.get(milestoneId)?.get(teamId) ?? null;
}

export function setAdminPresentationOrderFixture(
  milestoneId: string,
  teamOrders: readonly { order: number; teamId: number }[],
) {
  ordersByMilestone.set(
    milestoneId,
    new Map(teamOrders.map(team => [team.teamId, team.order])),
  );
}

export function resetAdminPresentationOrderFixture() {
  ordersByMilestone.clear();
}
