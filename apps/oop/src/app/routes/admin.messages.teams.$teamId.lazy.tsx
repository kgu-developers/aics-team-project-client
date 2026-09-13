import { createLazyFileRoute } from '@tanstack/react-router';

import AdminTeamMessagesPage from '~/widgets/admin-messages/AdminTeamMessagesPage';

export const Route = createLazyFileRoute('/admin/messages/teams/$teamId')({
  component: AdminTeamMessagesPage,
});
