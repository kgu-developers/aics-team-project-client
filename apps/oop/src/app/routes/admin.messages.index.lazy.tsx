import { createLazyFileRoute } from '@tanstack/react-router';

import AdminMessagesPage from '~/widgets/admin-messages/AdminMessagesPage';

export const Route = createLazyFileRoute('/admin/messages/')({
  component: AdminMessagesPage,
});
