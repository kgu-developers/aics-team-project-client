import { createLazyFileRoute } from '@tanstack/react-router';

import { MeetingNewPage } from '~/widgets/meeting/MeetingPages';

export const Route = createLazyFileRoute('/student/meetings/new')({
  component: MeetingNewPage,
});
