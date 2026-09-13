import { createLazyFileRoute } from '@tanstack/react-router';

import AdminEvaluationDetailPage from '~/widgets/admin-evaluation-detail/AdminEvaluationDetailPage';

export const Route = createLazyFileRoute(
  '/admin/evaluations/$evaluationType/teams/$teamId',
)({
  component: AdminEvaluationDetailPage,
});
