import { createLazyFileRoute } from '@tanstack/react-router';

import AdminProfilePage from '~/widgets/admin-profile/AdminProfilePage';

export const Route = createLazyFileRoute('/admin/profile')({
  component: AdminProfilePage,
});
