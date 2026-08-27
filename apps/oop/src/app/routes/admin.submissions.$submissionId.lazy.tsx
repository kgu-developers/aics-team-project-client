import { createLazyFileRoute } from '@tanstack/react-router';

import AdminSubmissionDetailPage from '~/widgets/admin-submissions/AdminSubmissionDetailPage';

export const Route = createLazyFileRoute('/admin/submissions/$submissionId')({
  component: AdminSubmissionDetailPage,
});
