export const adminTeamDashboardKeys = {
  all: ['admin-team-dashboard'] as const,
  detail: (teamId: string) => [...adminTeamDashboardKeys.all, teamId] as const,
};
