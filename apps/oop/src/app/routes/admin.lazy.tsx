import {
  Navigate,
  createLazyFileRoute,
  useRouterState,
} from '@tanstack/react-router';

import AdminShell from '~/app/components/AdminShell';
import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import { safeRedirectPath } from '~/features/auth/safeRedirectPath';

export const Route = createLazyFileRoute('/admin')({
  component: AdminHomePage,
});

function AdminHomePage() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const currentUser = useAuthStore(state => state.currentUser);
  // Select a primitive so the subscription never re-renders on identity alone.
  const currentHref = useRouterState({ select: state => state.location.href });

  if (!hasSession || !currentUser) {
    // `safeRedirectPath` drops /login itself, so a router that keeps this
    // shell mounted on /login (tests, misconfigured trees) cannot loop.
    return (
      <Navigate
        search={{ redirect: safeRedirectPath(currentHref) }}
        to={ROUTES.LOGIN}
      />
    );
  }

  if (currentUser.globalRole === 'STUDENT') {
    return <Navigate to={ROUTES.STUDENT.HOME} />;
  }

  return <AdminShell />;
}
