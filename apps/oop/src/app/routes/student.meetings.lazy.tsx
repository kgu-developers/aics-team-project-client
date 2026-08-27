import { Outlet, createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/student/meetings')({
  component: MeetingRoute,
});

function MeetingRoute() {
  return <Outlet />;
}
