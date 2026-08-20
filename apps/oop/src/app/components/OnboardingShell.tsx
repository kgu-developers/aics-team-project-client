import { Outlet } from '@tanstack/react-router';

import * as styles from './OnboardingShell.css';

export default function OnboardingShell() {
  return (
    <main className={styles.shell}>
      <p className={styles.eyebrow}>AICS Team Project</p>
      <div className={styles.shellCard}>
        <Outlet />
      </div>
    </main>
  );
}
