import { Outlet, createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/admin/notices/$noticeId')({
  component: Outlet,
});
