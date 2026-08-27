import { createLazyFileRoute } from '@tanstack/react-router';

import AdminSubmissionsPage from '~/widgets/admin-submissions/AdminSubmissionsPage';

export const Route = createLazyFileRoute('/admin/submissions/')({
  component: AdminSubmissionsPage,
});
