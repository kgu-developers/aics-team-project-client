import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

export const Route = createLazyFileRoute('/admin/profile')({
  component: AdminProfileRedirect,
});

function AdminProfileRedirect() {
  return <Navigate replace to={ROUTES.ADMIN} />;
}
