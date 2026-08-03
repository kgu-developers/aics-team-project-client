import { Navigate, createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/onboarding/team/')({
  component: OnboardingTeamEntryPage,
});

function OnboardingTeamEntryPage() {
  // KD3-67 auth/API work will replace this scaffold redirect with the
  // server-authoritative onboarding phase resolver.
  return <Navigate to='/onboarding/team/survey' />;
}
