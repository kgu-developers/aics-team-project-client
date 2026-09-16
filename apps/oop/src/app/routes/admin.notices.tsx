import { createFileRoute } from '@tanstack/react-router';

import { noticeId } from '~/features/admin-notices/noticeScope';

export const Route = createFileRoute('/admin/notices')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { sectionId?: number } => ({
    sectionId: noticeId(search.sectionId),
  }),
});
