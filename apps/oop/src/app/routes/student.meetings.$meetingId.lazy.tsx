import { Outlet, createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/student/meetings/$meetingId')({
  component: MeetingDetailRoute,
});

function MeetingDetailRoute() {
  return <Outlet />;
}
