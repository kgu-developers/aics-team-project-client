import { createLazyFileRoute } from '@tanstack/react-router';

import { AdminNoticeDetailPage } from '~/widgets/admin-notices/AdminNoticePages';

export const Route = createLazyFileRoute('/admin/notices/$noticeId')({
  component: AdminNoticeDetailPage,
});
