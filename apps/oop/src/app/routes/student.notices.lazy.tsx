import { Outlet, createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/student/notices')({
  component: Outlet,
});
