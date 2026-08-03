import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/')({
  component: IndexRoute,
});

function IndexRoute() {
  return <Navigate to='/student' />;
}
