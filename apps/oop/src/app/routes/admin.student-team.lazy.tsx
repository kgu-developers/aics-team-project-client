import { createLazyFileRoute } from '@tanstack/react-router';

import AdminStudentTeamManagement from '~/widgets/admin-student-team/AdminStudentTeamManagement';

export const Route = createLazyFileRoute('/admin/student-team')({
  component: AdminStudentTeamManagement,
});
