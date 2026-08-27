import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMeetingsPage from '~/widgets/admin-meetings/AdminMeetingsPage';

export const Route = createLazyFileRoute('/admin/meetings/')({
  component: AdminMeetingsPage,
});
