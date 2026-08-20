import { createLazyFileRoute, Navigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

export const Route = createLazyFileRoute('/student/project-topic')({
  component: StudentProjectTopicRedirect,
});

function StudentProjectTopicRedirect() {
  return <Navigate replace to={ROUTES.STUDENT.HOME} />;
}
