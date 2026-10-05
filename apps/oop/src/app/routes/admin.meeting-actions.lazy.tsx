import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMeetingActionsPage from '~/widgets/admin-meeting-actions/AdminMeetingActionsPage';

export const Route = createLazyFileRoute('/admin/meeting-actions')({
  component: AdminMeetingActionsPage,
});
