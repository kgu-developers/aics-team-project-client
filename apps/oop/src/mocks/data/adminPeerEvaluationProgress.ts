export const adminPeerEvaluationProgress = {
  'team-1151-1': { submittedMemberCount: 1, memberCount: 2 },
  'team-1151-2': { submittedMemberCount: 0, memberCount: 2 },
} as const;

export function getAdminPeerEvaluationProgress(teamId: string) {
  return (
    adminPeerEvaluationProgress[teamId as keyof typeof adminPeerEvaluationProgress] ?? {
      submittedMemberCount: 0,
      memberCount: 0,
    }
  );
}
