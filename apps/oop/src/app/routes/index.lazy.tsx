import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

import { useAuthStore } from '~/features/auth/authStore';

export const Route = createLazyFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!accessToken || !currentUser) {
    return <Navigate to='/login' />;
  }

  return (
    <Navigate
      to={currentUser.globalRole === 'STUDENT' ? '/student' : '/admin'}
    />
  );
}
