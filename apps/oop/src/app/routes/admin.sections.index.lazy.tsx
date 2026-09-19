import { createLazyFileRoute } from '@tanstack/react-router';

import AdminCoursesPage from '~/widgets/admin-course/AdminCoursesPage';

export const Route = createLazyFileRoute('/admin/sections/')({
  component: AdminCoursesPage,
});
