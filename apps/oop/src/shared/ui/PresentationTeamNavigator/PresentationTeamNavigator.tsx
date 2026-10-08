import { Button, Card } from '@aics/design-system';

import { cx } from '~/shared/lib/cx';

import * as styles from './PresentationTeamNavigator.css';

type PresentationTeamNavigatorProps = {
  currentIndex: number;
  isNextDisabled: boolean;
  isPreviousDisabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  presentationLabel: string;
  withAdminSidebar?: boolean;
  teamLabel: string;
  total: number;
};

export function PresentationTeamNavigator({
  currentIndex,
  isNextDisabled,
  isPreviousDisabled,
  onNext,
  onPrevious,
  presentationLabel,
  teamLabel,
  total,
  withAdminSidebar = false,
}: PresentationTeamNavigatorProps) {
  return (
    <footer
      aria-label='발표 팀 이동'
      className={cx(
        styles.footer,
        withAdminSidebar ? styles.footerWithAdminSidebar : undefined,
      )}
    >
      <Card className={styles.card} padding={2} variant='muted' width='100%'>
        <nav aria-label='발표 팀 이동' className={styles.navigation}>
          <Button
            isDisabled={isPreviousDisabled}
            label='이전 팀'
            onClick={onPrevious}
            type='button'
            variant='secondary'
          />
          <p className={styles.status}>
            {presentationLabel} · {teamLabel} · {currentIndex + 1} / {total}
          </p>
          <Button
            isDisabled={isNextDisabled}
            label='다음 팀'
            onClick={onNext}
            type='button'
            variant='secondary'
          />
        </nav>
      </Card>
    </footer>
  );
}
