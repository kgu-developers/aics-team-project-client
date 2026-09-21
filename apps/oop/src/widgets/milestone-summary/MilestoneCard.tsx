import type { StudentHomeMilestone } from '@aics/core';
import { Button, Collapsible, StatusDot, useToast } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { EDITOR_DOCS, editorSectionTo } from '~/app/constants/editorSections';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';
import { cx } from '~/shared/lib/cx';

import { useAuthStore } from '~/features/auth/authStore';
import MidReportSubmitAction from '~/features/mid-report/MidReportSubmitAction';
import { useTopicApi } from '~/features/project-topic/TopicApiContext';
import { useTopicCandidateDialog } from '~/features/project-topic/TopicCandidateDialogContext';
import TopicFinalizePanel from '~/features/project-topic/TopicFinalizePanel';
import ProposalSubmitAction from '~/features/proposal/ProposalSubmitAction';
import { useStudentContext } from '~/features/section/useStudentContext';
import FinalReportSubmissionAction from '~/features/submission/member-confirmations/FinalReportSubmissionAction';
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
  closed: 'neutral',
  unavailable: 'neutral',
  'in-progress': 'accent',
  'revision-available': 'accent',
  'before-period': 'neutral',
} as const;

const STATUS_LABEL = {
  completed: '완료',
  closed: '마감',
  unavailable: '진행 전',
  'in-progress': '진행 중',
  'revision-available': '진행 중',
  'before-period': '진행 전',
} as const;

const OPERATIONAL_STATUS_LABELS = new Set([
  '조회 중',
  '조회 실패',
  '상태 확인 필요',
  '이전 단계 완료 필요',
  '팀 배정 대기',
  '팀 소속 확인 필요',
  '양식 준비 중',
  '일정 미정',
]);

export function milestoneHeaderStatusLabel(milestone: StudentHomeMilestone) {
  return OPERATIONAL_STATUS_LABELS.has(milestone.statusLabel)
    ? milestone.statusLabel
    : STATUS_LABEL[milestone.status];
}

export default function MilestoneCard({
  milestone,
  isOpen,
}: MilestoneCardProps) {
  const navigate = useNavigate();
  const topicApi = useTopicApi();
  const toast = useToast();
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const context = useStudentContext(!isDemo);
  const canAct = isDemo || context.status === 'ready';
  const currentUser = useAuthStore(state => state.currentUser);
  const { setIsOpen: setTopicCandidateDialogOpen } = useTopicCandidateDialog();
  const { openDialog: openSubmissionDialog, submissionTargets } =
    useSubmissionDialog();
  const sectionId =
    isDemo && currentUser?.sections.length === 1
      ? currentUser.sections[0]!.id
      : context.status === 'ready'
        ? String(context.section!.id)
        : '';
  const userId = (isDemo ? currentUser : context.user)?.studentNumber ?? '';
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
  const statusLabel = milestoneHeaderStatusLabel(milestone);
  const editorReturnTo =
    milestone.id === 'proposal' || milestone.id === 'mid-review'
      ? milestone.id
      : undefined;

  function navigateToAction(actionTo: string) {
    if (editorReturnTo === 'proposal') {
      const section = EDITOR_DOCS.proposal.sections.find(
        item => actionTo === editorSectionTo('proposal', item.slug),
      )?.slug;
      if (section) {
        return navigate({
          params: { section },
          search: { returnTo: 'proposal' },
          to: '/student/editor/proposal/$section',
        });
      }
    }
    if (editorReturnTo === 'mid-review') {
      const section = EDITOR_DOCS['mid-review'].sections.find(
        item => actionTo === editorSectionTo('mid-review', item.slug),
      )?.slug;
      if (section) {
        return navigate({
          params: { section },
          search: { returnTo: 'mid-review' },
          to: '/student/editor/mid-review/$section',
        });
      }
    }
    return navigate({ to: actionTo });
  }

  const headerTrigger = (
    <>
      <span className={styles.milestoneTitle}>{milestone.title}</span>
      <span className={styles.milestonePeriod}>{milestone.period}</span>
    </>
  );

  const body =
    milestone.isDetailAvailable && milestone.body ? (
      <MilestoneDetails body={milestone.body} milestoneId={milestone.id} />
    ) : null;

  function handleFinalReportAction() {
    if (!canAct) return;
    if (submissionTargets[milestone.id] || isTeamLeader) {
      openSubmissionDialog('final-report', milestone.id);
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

  function renderRow(
    row: StudentHomeMilestone['rows'][number],
    actionOverride?: ReactNode,
  ) {
    return (
      <div className={styles.milestoneRow} key={row.id}>
        <div className={styles.rowCell}>
          <p className={styles.rowLabel}>{row.label}</p>
        </div>
        <div className={styles.rowCell}>
          <p className={cx(styles.rowValue, ROW_TONE_CLASS[row.tone])}>
            {row.id === 'proposal-topic-selection' && topicApi
              ? topicApi.boardQuery.data?.candidates.some(
                  candidate => candidate.isMyVote,
                )
                ? '내 투표 완료'
                : row.value
              : row.value}
          </p>
        </div>
        <div className={styles.rowCell}>
          {actionOverride ??
            (row.actionLabel ? (
              <>
                {row.id === 'proposal-submit' ? (
                  <ProposalSubmitAction
                    className={styles.rowAction}
                    isDisabled={!canAct || row.actionDisabled}
                    label={row.actionLabel}
                  />
                ) : row.id === 'mid-report-submit' && canAct ? (
                  <MidReportSubmitAction
                    className={styles.rowAction}
                    isDisabled={row.actionDisabled}
                    label={row.actionLabel}
                  />
                ) : row.id === 'proposal-topic-selection' &&
                  topicApi?.offerFinalization ? (
                  <TopicFinalizePanel
                    {...topicApi.scope}
                    participationBusy={topicApi.busy}
                    className={styles.rowAction}
                    isDisabled={!canAct || row.actionDisabled}
                    onFinalized={() => {
                      void navigate({
                        search: { returnTo: 'proposal' },
                        to: editorSectionTo('proposal', 'team-info'),
                      });
                    }}
                  />
                ) : (
                  <Button
                    className={styles.rowAction}
                    isDisabled={
                      !canAct ||
                      row.actionDisabled ||
                      (row.id === 'proposal-topic-selection' && topicApi
                        ? !topicApi.canParticipate ||
                          topicApi.busy ||
                          topicApi.boardQuery.data?.candidates.some(
                            candidate => candidate.isMine,
                          )
                        : false) ||
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
                          : milestone.body?.kind === 'presentation-material' &&
                              row.id === 'presentation-material'
                            ? () =>
                                openSubmissionDialog(
                                  'presentation',
                                  milestone.id,
                                )
                            : row.actionTo
                              ? () => navigateToAction(row.actionTo!)
                              : undefined
                    }
                    size='md'
                    tooltip={row.actionNotice}
                    variant='primary'
                  />
                )}
              </>
            ) : null)}
        </div>
      </div>
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
          <StatusDot label={statusLabel} variant={statusVariant} />
          <p className={styles.statusLabel}>{statusLabel}</p>
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
          {milestone.rows.map(row => {
            const target =
              row.id === 'final-report-submission'
                ? submissionTargets[milestone.id]
                : undefined;
            return target && canAct && !row.actionDisabled ? (
              <FinalReportSubmissionAction
                key={row.id}
                target={target}
                onSubmit={() =>
                  openSubmissionDialog('final-report', milestone.id)
                }
              >
                {state =>
                  renderRow(
                    { ...row, value: state.value },
                    <Button
                      className={styles.rowAction}
                      label={state.actionLabel}
                      isDisabled={state.disabled}
                      isLoading={state.busy}
                      tooltip={state.notice}
                      onClick={() => void state.onAction()}
                      size='md'
                      variant='primary'
                    />,
                  )
                }
              </FinalReportSubmissionAction>
            ) : (
              renderRow(row)
            );
          })}
        </div>
      </div>
    </article>
  );
}
