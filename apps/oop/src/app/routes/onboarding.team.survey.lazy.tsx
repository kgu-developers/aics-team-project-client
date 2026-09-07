import { createLazyFileRoute, Navigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

export const Route = createLazyFileRoute('/onboarding/team/survey')({
  component: Page,
});
function Page() {
  return <Navigate replace to={ROUTES.ONBOARDING.TEAM} />;
}
