import { createLazyFileRoute } from '@tanstack/react-router';

import StudentNoticeListPage from '~/widgets/student-notices/StudentNoticeListPage';

export const Route = createLazyFileRoute('/student/notices/')({
  component: StudentNoticeListPage,
});
