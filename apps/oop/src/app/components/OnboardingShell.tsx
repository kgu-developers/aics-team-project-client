import { Outlet } from '@tanstack/react-router';

import * as styles from './OnboardingShell.css';

export default function OnboardingShell() {
  return (
    <main className={styles.shell}>
      <div className={styles.shellCard}>
        <p className={styles.eyebrow}>OOP Team Project</p>
        <Outlet />
      </div>
    </main>
  );
}
