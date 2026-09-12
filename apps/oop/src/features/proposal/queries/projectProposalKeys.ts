const sessions = new WeakMap<object, number>();
let next = 0;
export const projectProposalKeys = {
  all: ['project-proposal'] as const,
  scope(session: object, teamId?: string | null) {
    if (!sessions.has(session)) sessions.set(session, ++next);
    return [...this.all, sessions.get(session), teamId] as const;
  },
};
export function validProposalTeamId(
  id: string | null | undefined,
): id is string {
  return Boolean(
    id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)),
  );
}
