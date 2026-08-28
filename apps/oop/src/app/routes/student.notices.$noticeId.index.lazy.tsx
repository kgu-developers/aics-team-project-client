import { createLazyFileRoute } from '@tanstack/react-router';

import StudentNoticeDetailPage from '~/widgets/student-notices/StudentNoticeDetailPage';

export const Route = createLazyFileRoute('/student/notices/$noticeId/')({
  component: StudentNoticeDetailRoute,
});

function StudentNoticeDetailRoute() {
  const { noticeId } = Route.useParams();
  return <StudentNoticeDetailPage noticeId={noticeId} />;
}
