import { Button } from '@aics/design-system';

import * as styles from './TeamAssignmentFlow.css';
export default function OnboardingRecovery({
  description,
  onRelogin,
  onRetry,
  title,
}: {
  description: string;
  onRelogin: () => void;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <section
      className={styles.recoveryPage}
      aria-labelledby='onboarding-recovery-heading'
    >
      <div className={styles.recoveryContent}>
        <h1 id='onboarding-recovery-heading'>{title}</h1>
        <p>{description}</p>
        <p>수강 분반이 아직 연결되지 않았다면 담당 조교에게 문의해 주세요.</p>
      </div>
      <div className={`${styles.actions} ${styles.centeredActions}`}>
        {onRetry ? (
          <Button label='다시 확인' onClick={onRetry} variant='secondary' />
        ) : null}
        <Button label='다시 로그인' onClick={onRelogin} variant='primary' />
      </div>
    </section>
  );
}
