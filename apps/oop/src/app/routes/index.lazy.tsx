import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

export const Route = createLazyFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!hasSession || !currentUser) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  return (
    <Navigate
      to={
        currentUser.globalRole === 'STUDENT'
          ? ROUTES.STUDENT.HOME
          : ROUTES.ADMIN
      }
    />
  );
}
