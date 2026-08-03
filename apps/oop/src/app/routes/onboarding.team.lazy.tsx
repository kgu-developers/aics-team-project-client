import { createLazyFileRoute } from '@tanstack/react-router';

import NotFoundPage from '~/app/components/NotFoundPage';
import OnboardingShell from '~/app/components/OnboardingShell';

export const Route = createLazyFileRoute('/onboarding/team')({
  component: OnboardingShell,
  notFoundComponent: NotFoundPage,
});
