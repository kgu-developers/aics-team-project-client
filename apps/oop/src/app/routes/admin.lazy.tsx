import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';

import AdminHomeDashboard from '~/widgets/admin-dashboard/AdminHomeDashboard';

export const Route = createLazyFileRoute('/admin')({
  component: AdminHomePage,
});

function AdminHomePage() {
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!accessToken || !currentUser) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (currentUser.globalRole === 'STUDENT') {
    return <Navigate to={ROUTES.STUDENT.HOME} />;
  }

  return <AdminHomeDashboard />;
}
