import type { StudentHomeMilestone } from '@aics/core';
import { Button, Collapsible, StatusDot, useToast } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { cx } from '~/shared/lib/cx';

import { useAuthStore } from '~/features/auth/authStore';
import { useTopicCandidateDialog } from '~/features/project-topic/TopicCandidateDialogContext';
import { useUpdateSubmissionConfirmationMutation } from '~/features/submission/queries';
import { useSubmissionDialog } from '~/features/submission/SubmissionDialogContext';

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
  const toast = useToast();
  const currentUser = useAuthStore(state => state.currentUser);
  const { setIsOpen: setTopicCandidateDialogOpen } = useTopicCandidateDialog();
  const { openDialog: openSubmissionDialog } = useSubmissionDialog();
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const userId = currentUser?.studentNumber ?? '';
  const confirmationMutation = useUpdateSubmissionConfirmationMutation(
    sectionId,
    userId,
  );
  const isTeamLeader = Boolean(
    currentUser?.currentTeam?.members.find(
      member => member.id === currentUser.id,
    )?.isLeader,
  );
  const finalReportBody =
    milestone.body?.kind === 'final-report' ? milestone.body : null;
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

  function handleFinalReportAction() {
    if (isTeamLeader) {
      openSubmissionDialog('final-report');
      return;
    }
    if (!finalReportBody?.submissionId || !finalReportBody.memberConsent) {
      return;
    }

    const confirmed = !finalReportBody.memberConsent.isConfirmedByMe;
    confirmationMutation.mutate(
      { submissionId: finalReportBody.submissionId, confirmed },
      {
        onError: () =>
          toast({
            body: '최종보고서 승인 상태를 변경하지 못했어요.',
            type: 'error',
          }),
        onSuccess: () =>
          toast({
            body: confirmed
              ? '최종보고서를 승인했어요.'
              : '최종보고서 승인을 취소했어요.',
          }),
      },
    );
  }

  return (
    <article
      className={styles.milestone}
      id={`student-milestone-${milestone.id}`}
      tabIndex={-1}
    >
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
                      isDisabled={
                        row.actionDisabled ||
                        (row.id === 'final-report-submission' &&
                          confirmationMutation.isPending)
                      }
                      isLoading={
                        row.id === 'final-report-submission' &&
                        confirmationMutation.isPending
                      }
                      label={row.actionLabel}
                      onClick={
                        row.id === 'proposal-topic-selection'
                          ? () => setTopicCandidateDialogOpen(true)
                          : row.id === 'final-report-submission'
                            ? handleFinalReportAction
                            : milestone.body?.kind ===
                                  'presentation-material' &&
                                row.id === 'presentation-material'
                              ? () => openSubmissionDialog('presentation')
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
