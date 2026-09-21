import type { TeamMessage, TeamMessageRelatedType } from '@aics/core';
import {
  Badge,
  Button,
  Card,
  Dialog,
  EmptyState,
  Heading,
  Text,
  TextArea,
} from '@aics/design-system';
import { useMemo, useRef, useState } from 'react';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';
import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { useAuthStore } from '~/features/auth/authStore';
import { useCurrentMidReportQuery } from '~/features/mid-report/queries';
import StudentContextState from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';
import { proposalFeedbackStage } from '~/features/student-home/model/documentFeedbackStage';
import {
  useMilestoneScheduleClock,
  useStudentMilestonesQuery,
} from '~/features/student-home/queries';
import { useTeamProjectQuery } from '~/features/student-home/queries/useTeamProjectQuery';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';
import {
  useSubmitTeamMessageMutation,
  useTeamMessagesQuery,
  useUpdateTeamMessageReadMutation,
} from '~/features/team-message/queries';

import { messageReplyAvailability } from './messageReplyAvailability';
import * as styles from './StudentMessagesPage.css';

const relatedTypeLabels: Record<TeamMessageRelatedType, string> = {
  PROPOSAL: '제안서 피드백',
  MEETING: '회의록',
  MID_REPORT: '중간점검 피드백',
  FINAL_SUBMISSION: '최종 제출',
  REVIEW: '평가',
  QUESTION: '질문',
  GENERAL: '일반 메시지',
};

function belongsToConversation(message: TeamMessage, selected: TeamMessage) {
  if (
    message.threadId !== selected.threadId ||
    message.relatedType !== selected.relatedType
  ) {
    return false;
  }

  return selected.relatedId == null
    ? message.relatedId == null
    : message.relatedId === selected.relatedId;
}

export default function StudentMessagesPage() {
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const currentUser = useAuthStore(state => state.currentUser);
  const context = useStudentContext(!isDemo);
  const teamId = isDemo ? (currentUser?.teamId ?? undefined) : context.teamId;
  const sectionId =
    !isDemo && context.section?.id ? String(context.section.id) : undefined;
  const teamQuery = useTeamKickoffQuery(teamId);
  const messagesQuery = useTeamMessagesQuery(teamId);
  const projectQuery = useTeamProjectQuery(isDemo ? undefined : teamId);
  const midReportQuery = useCurrentMidReportQuery(!isDemo && Boolean(teamId));
  const milestonesQuery = useStudentMilestonesQuery(sectionId, teamId);
  const now = useMilestoneScheduleClock(
    milestonesQuery.milestones,
    sectionId,
    teamId,
  );
  const submitMutation = useSubmitTeamMessageMutation(teamId);
  const readMutation = useUpdateTeamMessageReadMutation(teamId);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(
    null,
  );
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);
  const [readErrorIds, setReadErrorIds] = useState<Set<number>>(
    () => new Set(),
  );
  const pendingReadIds = useRef(new Set<number>());
  const messages = messagesQuery.data ?? [];
  const memberIds = useMemo(
    () =>
      new Set([
        currentUser?.studentNumber,
        ...(teamQuery.data?.members.map(member => member.studentNumber) ?? []),
      ]),
    [currentUser?.studentNumber, teamQuery.data?.members],
  );
  const receivedMessages = useMemo(
    () =>
      [...messages]
        .filter(message => !memberIds.has(message.senderId))
        .reverse(),
    [memberIds, messages],
  );
  const selectedMessage = receivedMessages.find(
    message => message.id === selectedMessageId,
  );
  const conversation = selectedMessage
    ? messages.filter(message =>
        belongsToConversation(message, selectedMessage),
      )
    : [];
  const teamMemberIds = teamQuery.isSuccess
    ? [...memberIds].filter((memberId): memberId is string => Boolean(memberId))
    : undefined;
  const proposalCycleCompleted = Boolean(
    projectQuery.data &&
    proposalFeedbackStage({
      submittedAt: projectQuery.data.proposalCompletedAt,
      messages,
      relatedId: projectQuery.data.id,
      teamMemberIds,
      isMessagesReady: messagesQuery.isSuccess,
    }) === 'completed',
  );
  const midReportCycleCompleted = Boolean(
    midReportQuery.data?.status === 'SUBMITTED' &&
    midReportQuery.data.revision?.resubmittedAt,
  );
  const isProposalReply = selectedMessage?.relatedType === 'PROPOSAL';
  const isMidReportReply = selectedMessage?.relatedType === 'MID_REPORT';
  const replyAvailability = selectedMessage
    ? messageReplyAvailability({
        isFeedbackCycleCompleted:
          (isProposalReply && proposalCycleCompleted) ||
          (isMidReportReply && midReportCycleCompleted),
        isFeedbackCycleError:
          (isProposalReply &&
            (projectQuery.isError ||
              teamQuery.isError ||
              messagesQuery.isError)) ||
          (isMidReportReply && midReportQuery.isError),
        isFeedbackCyclePending:
          (isProposalReply &&
            (projectQuery.isPending ||
              teamQuery.isPending ||
              messagesQuery.isPending)) ||
          (isMidReportReply && midReportQuery.isPending),
        isDemo,
        isMilestoneListError: milestonesQuery.list.isError,
        isMilestoneListPending: milestonesQuery.list.isPending,
        milestones: milestonesQuery.milestones,
        now,
        relatedType: selectedMessage.relatedType,
        submissions: milestonesQuery.submissions,
      })
    : { canReply: false };

  const closeDialog = () => {
    if (submitMutation.isPending) return;
    setSelectedMessageId(null);
    setReply('');
    setReplyError(null);
  };

  const markMessageRead = (messageId: number) => {
    if (pendingReadIds.current.has(messageId)) return;

    pendingReadIds.current.add(messageId);
    setReadErrorIds(current => {
      if (!current.has(messageId)) return current;
      const next = new Set(current);
      next.delete(messageId);
      return next;
    });
    void readMutation
      .mutateAsync(messageId)
      .catch(() => {
        setReadErrorIds(current => new Set(current).add(messageId));
      })
      .finally(() => {
        pendingReadIds.current.delete(messageId);
      });
  };

  const openDialog = (message: TeamMessage) => {
    setSelectedMessageId(message.id);
    setReply('');
    setReplyError(null);
    if (!message.read) markMessageRead(message.id);
  };

  if (!isDemo && context.status !== 'ready' && context.status !== 'no-team') {
    return <StudentContextState context={context} />;
  }

  if (!teamId) {
    return (
      <EmptyState
        title='쪽지함을 열 수 없어요.'
        description='팀 배정이 완료되면 교수자에게 받은 메시지를 확인할 수 있어요.'
      />
    );
  }

  if (teamQuery.isPending || messagesQuery.isPending) {
    return <Text role='status'>쪽지함을 불러오는 중입니다.</Text>;
  }

  if (teamQuery.isError || messagesQuery.isError) {
    return (
      <EmptyState
        title='쪽지함을 불러오지 못했어요.'
        description='잠시 후 다시 시도해 주세요.'
        actions={
          <Button
            label='다시 시도'
            onClick={() => {
              void teamQuery.refetch();
              void messagesQuery.refetch();
            }}
          />
        }
      />
    );
  }

  return (
    <main className={styles.page}>
      <header>
        <Heading className={styles.heading} level={1}>
          쪽지함
        </Heading>
        <Text color='secondary'>
          교수자에게 받은 팀 메시지와 피드백을 확인하고, 기존 대화에 답장할 수
          있어요.
        </Text>
      </header>

      <Card className={styles.tableCard}>
        {receivedMessages.length === 0 ? (
          <EmptyState
            title='받은 메시지가 없어요.'
            description='교수자가 팀 메시지를 보내면 이곳에 표시됩니다.'
          />
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>유형</th>
                <th>보낸 사람</th>
                <th>내용</th>
                <th>받은 시각</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {receivedMessages.map(message => (
                <tr
                  className={cx(
                    styles.messageRow,
                    !message.read && styles.unread,
                  )}
                  key={message.id}
                  onClick={event => {
                    if ((event.target as HTMLElement).closest('button')) return;
                    openDialog(message);
                  }}
                >
                  <td>
                    <Badge
                      label={relatedTypeLabels[message.relatedType]}
                      variant={message.read ? 'neutral' : 'info'}
                    />
                  </td>
                  <td>{message.senderName ?? message.senderId}</td>
                  <td>{message.message}</td>
                  <td>{formatSeoulDateTime(message.createdAt)}</td>
                  <td>
                    <Button
                      aria-label={`${relatedTypeLabels[message.relatedType]} 대화 열기`}
                      label='열기'
                      onClick={() => openDialog(message)}
                      variant='ghost'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog
        aria-label='교수자 팀 메시지 대화'
        isOpen={Boolean(selectedMessage)}
        onOpenChange={isOpen => {
          if (!isOpen) closeDialog();
        }}
        purpose='info'
        width={720}
      >
        {selectedMessage ? (
          <div className={styles.modal}>
            <header className={styles.modalHeader}>
              <Heading level={2}>
                {relatedTypeLabels[selectedMessage.relatedType]}
              </Heading>
              <Text color='secondary'>
                {selectedMessage.senderName ?? selectedMessage.senderId}에게
                받은 메시지에 답장합니다.
              </Text>
            </header>

            {readErrorIds.has(selectedMessage.id) ? (
              <div className={styles.readError} role='alert'>
                <Text>읽음 상태를 저장하지 못했습니다.</Text>
                <Button
                  label='읽음 처리 다시 시도'
                  onClick={() => markMessageRead(selectedMessage.id)}
                  variant='ghost'
                />
              </div>
            ) : null}

            <div aria-label='기존 메시지' className={styles.thread} role='log'>
              {conversation.map(message => {
                const isOwnMessage =
                  message.senderId === currentUser?.studentNumber;
                return (
                  <div
                    className={cx(
                      styles.message,
                      isOwnMessage && styles.ownMessage,
                    )}
                    key={message.id}
                  >
                    <Text className={styles.messageMeta} type='supporting'>
                      {isOwnMessage
                        ? '나'
                        : (message.senderName ?? message.senderId)}{' '}
                      · {formatSeoulDateTime(message.createdAt)}
                    </Text>
                    <Text>{message.message}</Text>
                  </div>
                );
              })}
            </div>

            <div className={styles.composer}>
              <TextArea
                aria-label='답장 내용'
                isDisabled={
                  submitMutation.isPending || !replyAvailability.canReply
                }
                label='답장'
                onChange={value => {
                  setReply(value);
                  if (replyError) setReplyError(null);
                }}
                placeholder='답장 내용을 입력하세요.'
                value={reply}
              />
              {replyAvailability.reason ? (
                <Text color='secondary' role='status'>
                  {replyAvailability.reason}
                </Text>
              ) : null}
              {replyError ? <Text role='alert'>{replyError}</Text> : null}
              <div className={styles.actions}>
                <Button
                  isDisabled={
                    !replyAvailability.canReply ||
                    !reply.trim() ||
                    submitMutation.isPending
                  }
                  isLoading={submitMutation.isPending}
                  label='답장 보내기'
                  onClick={() => {
                    const target = receivedMessages.find(
                      message => message.id === selectedMessage.id,
                    );
                    if (!target || !reply.trim() || !replyAvailability.canReply)
                      return;
                    setReplyError(null);
                    submitMutation.mutate(
                      {
                        message: reply.trim(),
                        relatedId: target.relatedId,
                        relatedType: target.relatedType,
                      },
                      {
                        onError: () =>
                          setReplyError(
                            '답장을 보내지 못했습니다. 다시 시도해 주세요.',
                          ),
                        onSuccess: () => setReply(''),
                      },
                    );
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>
    </main>
  );
}
