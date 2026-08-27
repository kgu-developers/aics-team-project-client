import { createLazyFileRoute } from '@tanstack/react-router';

import { MeetingDetailPage } from '~/widgets/meeting/MeetingPages';

export const Route = createLazyFileRoute('/student/meetings/$meetingId/')({
  component: MeetingDetailRoute,
});

function MeetingDetailRoute() {
  const { meetingId } = Route.useParams();
  return <MeetingDetailPage meetingId={meetingId} />;
}
