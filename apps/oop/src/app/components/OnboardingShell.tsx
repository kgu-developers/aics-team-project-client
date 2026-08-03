import { Outlet } from '@tanstack/react-router';

export default function OnboardingShell() {
  return (
    <main className='onboarding-shell'>
      <div className='onboarding-shell__card'>
        <p className='onboarding-shell__eyebrow'>OOP Team Project</p>
        <Outlet />
      </div>
    </main>
  );
}
