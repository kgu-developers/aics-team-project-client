import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMilestoneSetupPage from '~/widgets/admin-milestones/AdminMilestoneSetupPage';

export const Route = createLazyFileRoute('/admin/milestones/new')({
  component: AdminMilestoneSetupPage,
});
