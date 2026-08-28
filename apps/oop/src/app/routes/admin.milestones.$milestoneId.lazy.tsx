import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMilestoneDetailPage from '~/widgets/admin-milestones/AdminMilestoneDetailPage';

export const Route = createLazyFileRoute('/admin/milestones/$milestoneId')({
  component: AdminMilestoneDetailPage,
});
