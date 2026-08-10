import { createLazyFileRoute } from '@tanstack/react-router';

import StudentHomePage from '~/widgets/student-dashboard/StudentHomePage';

export const Route = createLazyFileRoute('/student/')({
  component: StudentHomePage,
});
