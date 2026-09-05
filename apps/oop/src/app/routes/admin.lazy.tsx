import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import AdminShell from '~/app/components/AdminShell';
import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

export const Route = createLazyFileRoute('/admin')({
  component: AdminHomePage,
});

function AdminHomePage() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!hasSession || !currentUser) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (currentUser.globalRole === 'STUDENT') {
    return <Navigate to={ROUTES.STUDENT.HOME} />;
  }

  return <AdminShell />;
}
