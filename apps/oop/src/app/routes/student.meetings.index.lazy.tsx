import { createLazyFileRoute } from '@tanstack/react-router';

import { MeetingListPage } from '~/widgets/meeting/MeetingPages';

export const Route = createLazyFileRoute('/student/meetings/')({
  component: MeetingListPage,
});
