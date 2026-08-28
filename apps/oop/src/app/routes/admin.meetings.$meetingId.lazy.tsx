import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMeetingDetailPage from '~/widgets/admin-meetings/AdminMeetingDetailPage';

export const Route = createLazyFileRoute('/admin/meetings/$meetingId')({
  component: AdminMeetingDetailPage,
});
