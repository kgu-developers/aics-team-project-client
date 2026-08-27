import { createLazyFileRoute } from '@tanstack/react-router';

import { MeetingEditPage } from '~/widgets/meeting/MeetingPages';

export const Route = createLazyFileRoute('/student/meetings/$meetingId/edit')({
  component: Page,
});
function Page() {
  const { meetingId } = Route.useParams();
  return <MeetingEditPage meetingId={meetingId} />;
}
