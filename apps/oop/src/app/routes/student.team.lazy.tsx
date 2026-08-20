import { createLazyFileRoute } from '@tanstack/react-router';

import TeamAssignmentFlow from '~/features/team-assignment/TeamAssignmentFlow';
export const Route = createLazyFileRoute('/student/team')({ component: Page });
function Page() {
  return <TeamAssignmentFlow teamOnly />;
}
