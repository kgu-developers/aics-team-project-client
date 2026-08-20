import { createLazyFileRoute } from '@tanstack/react-router';

import TeamAssignmentFlow from '~/features/team-assignment/TeamAssignmentFlow';
export const Route = createLazyFileRoute('/onboarding/team/survey')({
  component: Page,
});
function Page() {
  return <TeamAssignmentFlow allowed={['survey', 'resultWaiting']} />;
}
