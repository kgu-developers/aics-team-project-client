import { createLazyFileRoute, useSearch } from '@tanstack/react-router';

import AdminPresentationProgressPage from '~/widgets/admin-presentation-progress/AdminPresentationProgressPage';

export const Route = createLazyFileRoute('/admin/presentation-progress')({
  component: AdminPresentationProgressRoutePage,
});

function AdminPresentationProgressRoutePage() {
  const { milestoneId, sectionId, teamId } = useSearch({
    from: '/admin/presentation-progress',
  });

  return (
    <AdminPresentationProgressPage
      milestoneId={milestoneId}
      sectionId={sectionId}
      teamId={teamId}
    />
  );
}
