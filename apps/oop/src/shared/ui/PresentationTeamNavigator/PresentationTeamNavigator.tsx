import {
  Button,
  Card,
  Selector,
  SelectorOption,
  StatusDot,
} from '@aics/design-system';

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
  teams?: ReadonlyArray<{
    label: string;
    statusLabel: string;
    value: string;
  }>;
  selectedTeamValue?: string;
  onSelectTeam?: (value: string) => void;
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
  teams,
  selectedTeamValue,
  onSelectTeam,
  withAdminSidebar = false,
}: PresentationTeamNavigatorProps) {
  const showTeamSelector = teams && selectedTeamValue && onSelectTeam;
  return (
    <footer
      aria-label='발표 팀 이동'
      className={cx(
        styles.footer,
        withAdminSidebar ? styles.footerWithAdminSidebar : undefined,
      )}
    >
      <Card className={styles.card} padding={2} width='100%'>
        <nav aria-label='발표 팀 이동' className={styles.navigation}>
          <Button
            isDisabled={isPreviousDisabled}
            label='이전 팀'
            onClick={onPrevious}
            type='button'
            variant='secondary'
          />
          {showTeamSelector ? (
            <div className={styles.mobileSelector}>
              <Selector
                isLabelHidden
                label='발표 팀 바로 이동'
                onChange={onSelectTeam}
                options={teams.map(team => ({
                  description: team.statusLabel,
                  label: team.label,
                  value: team.value,
                }))}
                placement='above'
                presentation='adaptive'
                renderOption={option => (
                  <SelectorOption
                    description={option.description}
                    endContent={
                      <StatusDot
                        label={String(option.description)}
                        variant={
                          String(option.description).includes('평가 전')
                            ? 'neutral'
                            : 'success'
                        }
                      />
                    }
                    label={option.label ?? option.value}
                  />
                )}
                renderValue={option => (
                  <SelectorOption
                    description={option.description}
                    endContent={
                      <StatusDot
                        label={String(option.description)}
                        variant={
                          String(option.description).includes('평가 전')
                            ? 'neutral'
                            : 'success'
                        }
                      />
                    }
                    label={option.label ?? option.value}
                    layout='inline'
                  />
                )}
                value={selectedTeamValue}
                width='100%'
              />
            </div>
          ) : null}
          <p
            className={cx(
              styles.status,
              showTeamSelector ? styles.desktopStatus : undefined,
            )}
          >
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
