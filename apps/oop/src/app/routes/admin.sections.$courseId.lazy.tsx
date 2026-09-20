import { createLazyFileRoute } from '@tanstack/react-router';

import AdminCourseDetailPage from '~/widgets/admin-course/AdminCourseDetailPage';

export const Route = createLazyFileRoute('/admin/sections/$courseId')({
  component: AdminCourseDetailPage,
});
