import { createLazyFileRoute } from '@tanstack/react-router';

import { AdminNoticeNewPage } from '~/widgets/admin-notices/AdminNoticePages';

export const Route = createLazyFileRoute('/admin/notices/new')({
  component: AdminNoticeNewPage,
});
