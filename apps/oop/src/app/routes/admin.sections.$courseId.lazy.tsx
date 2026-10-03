import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router';

import AdminCourseDetailPage from '~/widgets/admin-course/AdminCourseDetailPage';

const routeApi = getRouteApi('/admin/sections/$courseId');

function AdminCourseDetailRoute() {
  const { sectionId } = routeApi.useSearch();

  return (
    <AdminCourseDetailPage
      initialSectionId={sectionId === undefined ? undefined : String(sectionId)}
    />
  );
}

export const Route = createLazyFileRoute('/admin/sections/$courseId')({
  component: AdminCourseDetailRoute,
});
