import type { StudentHomeMilestone } from '@aics/core';
import { Button, Collapsible, StatusDot } from '@aics/design-system';
import { ArrowRight } from 'lucide-react';

import { cx } from '~/shared/lib/cx';

import * as styles from './MilestoneCard.css';
import MilestoneDetails from './MilestoneDetails';

type MilestoneCardProps = {
  milestone: StudentHomeMilestone;
  isOpen: boolean;
};

const ROW_TONE_CLASS = {
  primary: styles.rowValuePrimary,
  default: styles.rowValueDefault,
  muted: styles.rowValueMuted,
} as const;

export default function MilestoneCard({
  milestone,
  isOpen,
}: MilestoneCardProps) {
  const isCollapsible = milestone.interaction === 'collapsible';

  const headerTrigger = (
    <>
      <span className={styles.milestoneTitle}>{milestone.title}</span>
      <span className={styles.milestonePeriod}>{milestone.period}</span>
    </>
  );

  const body = milestone.body ? (
    <MilestoneDetails body={milestone.body} />
  ) : null;

  return (
    <article className={styles.milestone}>
      <div
        className={cx(
          styles.milestoneStatus,
          isOpen ? styles.milestoneStatusOpen : '',
        )}
      >
        <div className={styles.statusIndicator}>
          <StatusDot
            label={milestone.statusLabel}
            variant={milestone.status === 'completed' ? 'success' : 'neutral'}
          />
          <p className={styles.statusLabel}>{milestone.statusLabel}</p>
        </div>
        {isOpen ? (
          <>
            <p className={styles.statusTitle}>{milestone.title}</p>
            <p className={styles.statusTeam}>{milestone.dueDate}</p>
          </>
        ) : (
          <p className={styles.statusDue}>{milestone.dueDate}</p>
        )}
      </div>

      <div className={styles.milestoneContent}>
        {isCollapsible ? (
          <Collapsible trigger={headerTrigger} value={milestone.id}>
            {body}
          </Collapsible>
        ) : (
          <div className={styles.milestoneHeader}>{headerTrigger}</div>
        )}

        <div className={styles.milestoneRows}>
          {milestone.rows.map(row => (
            <div className={styles.milestoneRow} key={row.id}>
              <div className={styles.rowCell}>
                <p className={styles.rowLabel}>{row.label}</p>
              </div>
              <div className={styles.rowCell}>
                <p className={cx(styles.rowValue, ROW_TONE_CLASS[row.tone])}>
                  {row.value}
                </p>
              </div>
              <div className={styles.rowCell}>
                {row.actionLabel ? (
                  <>
                    <Button
                      className={styles.rowAction}
                      icon={<ArrowRight aria-hidden='true' size={14} />}
                      label={row.actionLabel}
                      size='md'
                      variant='primary'
                    />
                    {/* TODO(KD3-75 follow-up): 마일스톤 상세 티켓에서 행별 액션을 연결한다. */}
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
