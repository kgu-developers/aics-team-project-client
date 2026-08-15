import { createLazyFileRoute } from '@tanstack/react-router';

import AdminHomeDashboard from '~/widgets/admin-dashboard/AdminHomeDashboard';

export const Route = createLazyFileRoute('/admin/')({
  component: AdminHomeDashboard,
});
