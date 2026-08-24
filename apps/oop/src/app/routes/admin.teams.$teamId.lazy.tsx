import { createLazyFileRoute } from '@tanstack/react-router';

import AdminTeamDashboard from '~/widgets/admin-team-dashboard/AdminTeamDashboard';

export const Route = createLazyFileRoute('/admin/teams/$teamId')({
  component: AdminTeamDashboard,
});
