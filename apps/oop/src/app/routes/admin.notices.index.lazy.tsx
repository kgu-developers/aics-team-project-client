import { createLazyFileRoute } from '@tanstack/react-router';

import { AdminNoticeListPage } from '~/widgets/admin-notices/AdminNoticePages';

export const Route = createLazyFileRoute('/admin/notices/')({
  component: AdminNoticeListPage,
});
