import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMilestonesPage from '~/widgets/admin-milestones/AdminMilestonesPage';

export const Route = createLazyFileRoute('/admin/milestones/')({
  component: AdminMilestonesPage,
});
