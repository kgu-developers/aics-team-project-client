import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import { useAuthStore } from '~/features/auth/authStore';

export const Route = createLazyFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  const accessToken = useAuthStore(state => state.accessToken);

  return <Navigate to={accessToken ? '/student' : '/login'} />;
}
