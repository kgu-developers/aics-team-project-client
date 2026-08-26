import { Outlet } from '@tanstack/react-router';

import { SurveyShell } from '~/shared/ui/SurveyShell';

export default function OnboardingShell() {
  return (
    <main>
      <SurveyShell eyebrow='AICS Team Project' mode='standalone'>
        <Outlet />
      </SurveyShell>
    </main>
  );
}
