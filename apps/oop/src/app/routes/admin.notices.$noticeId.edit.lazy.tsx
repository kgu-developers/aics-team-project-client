import { createLazyFileRoute } from '@tanstack/react-router';

import { AdminNoticeEditPage } from '~/widgets/admin-notices/AdminNoticePages';

export const Route = createLazyFileRoute('/admin/notices/$noticeId/edit')({
  component: AdminNoticeEditPage,
});
