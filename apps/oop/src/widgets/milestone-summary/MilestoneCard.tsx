import type { StudentHomeMilestone } from '@aics/core';
import { Button, Collapsible, StatusDot } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { cx } from '~/shared/lib/cx';

import { useTopicCandidateDialog } from '~/features/project-topic/TopicCandidateDialogContext';
import { useFinalReportSubmissionDialog } from '~/features/submission/FinalReportSubmissionDialogContext';

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

const STATUS_VARIANT = {
  completed: 'success',
  'in-progress': 'accent',
  'revision-available': 'accent',
  'before-period': 'neutral',
} as const;

export default function MilestoneCard({
  milestone,
  isOpen,
}: MilestoneCardProps) {
  const navigate = useNavigate();
  const { setIsOpen: setTopicCandidateDialogOpen } = useTopicCandidateDialog();
  const { setIsOpen: setFinalReportSubmissionDialogOpen } =
    useFinalReportSubmissionDialog();
  const isCollapsible =
    milestone.isDetailAvailable && milestone.interaction === 'collapsible';
  const statusVariant = STATUS_VARIANT[milestone.status];

  const headerTrigger = (
    <>
      <span className={styles.milestoneTitle}>{milestone.title}</span>
      <span className={styles.milestonePeriod}>{milestone.period}</span>
    </>
  );

  const body =
    milestone.isDetailAvailable && milestone.body ? (
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
          <StatusDot label={milestone.statusLabel} variant={statusVariant} />
          <p className={styles.statusLabel}>{milestone.statusLabel}</p>
        </div>
        {isOpen ? (
          <>
            <p className={styles.statusTitle}>
              {milestone.currentStepLabel ?? milestone.title}
            </p>
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
                      isDisabled={row.actionDisabled}
                      label={row.actionLabel}
                      onClick={
                        row.id === 'proposal-topic-selection'
                          ? () => setTopicCandidateDialogOpen(true)
                          : row.id === 'final-report-submission'
                            ? () => setFinalReportSubmissionDialogOpen(true)
                            : row.actionTo
                              ? () => navigate({ to: row.actionTo })
                              : undefined
                      }
                      size='md'
                      tooltip={row.actionNotice}
                      variant='primary'
                    />
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
