import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router';

import AdminStudentTeamManagement from '~/widgets/admin-student-team/AdminStudentTeamManagement';

const routeApi = getRouteApi('/admin/student-team');

function AdminStudentTeamRoute() {
  const { sectionId } = routeApi.useSearch();

  return (
    <AdminStudentTeamManagement
      initialSectionId={sectionId === undefined ? undefined : String(sectionId)}
    />
  );
}

export const Route = createLazyFileRoute('/admin/student-team')({
  component: AdminStudentTeamRoute,
});
