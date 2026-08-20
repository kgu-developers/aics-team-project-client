import { createLazyFileRoute } from '@tanstack/react-router';

import TeamAssignmentFlow from '~/features/team-assignment/TeamAssignmentFlow';
export const Route = createLazyFileRoute('/onboarding/team/first-meeting')({
  component: Page,
});
function Page() {
  return <TeamAssignmentFlow allowed={['firstMeeting']} />;
}
