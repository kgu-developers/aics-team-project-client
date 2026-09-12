import { createLazyFileRoute } from '@tanstack/react-router';

import AdminCourseSectionManagementPage from '~/widgets/admin-course/AdminCourseSectionManagementPage';

export const Route = createLazyFileRoute('/admin/sections')({
  component: AdminCourseSectionManagementPage,
});
