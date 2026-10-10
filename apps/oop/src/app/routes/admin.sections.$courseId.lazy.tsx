import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router';

import AdminCourseDetailPage from '~/widgets/admin-course/AdminCourseDetailPage';

const routeApi = getRouteApi('/admin/sections/$courseId');

function AdminCourseDetailRoute() {
  const { sectionId, tab } = routeApi.useSearch();

  return (
    <AdminCourseDetailPage
      initialSectionId={sectionId === undefined ? undefined : String(sectionId)}
      initialTab={tab ?? 'basic'}
    />
  );
}

export const Route = createLazyFileRoute('/admin/sections/$courseId')({
  component: AdminCourseDetailRoute,
});
