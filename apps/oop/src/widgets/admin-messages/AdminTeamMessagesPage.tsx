import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Text,
  TextArea,
} from '@aics/design-system';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { formatAdminSectionLabel } from '~/shared/lib/formatAdminSectionLabel';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { useAdminRelatedSubmissionQuery } from '~/features/admin-message/queries';
import { useSubmitAdminMidReportFeedbackMutation } from '~/features/admin-milestone-review/queries/useSubmitAdminMidReportFeedbackMutation';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
import { useAdminTeamDashboardQuery } from '~/features/admin-team-dashboard/queries';
import { useAuthStore } from '~/features/auth/authStore';
import {
  useSubmitTeamMessageMutation,
  useTeamMessagesQuery,
} from '~/features/team-message/queries';

import * as styles from './AdminTeamMessagesPage.css';

type RelatedType = 'GENERAL' | 'PROPOSAL' | 'MID_REPORT';
type MessageFilter = 'ALL' | RelatedType;

const messageFilterLabels: Record<MessageFilter, string> = {
  ALL: '전체 쪽지',
  GENERAL: '일반 메시지',
  PROPOSAL: '제안서 피드백',
  MID_REPORT: '중간 보고서 피드백',
};

export default function AdminTeamMessagesPage() {
  const { teamId } = useParams({ from: '/admin/messages/teams/$teamId' });
  const search = useSearch({ from: '/admin/messages/teams/$teamId' }) as {
    type?: MessageFilter;
  };
  const currentUser = useAuthStore(state => state.currentUser);
  const teamQuery = useAdminTeamDashboardQuery(teamId);
  if (teamQuery.isPending)
    return <Text role='status'>팀 정보를 불러오는 중입니다.</Text>;
  if (teamQuery.isError)
    return (
      <EmptyState
        title='팀 정보를 불러오지 못했습니다.'
        actions={
          <Button
            label='팀 정보 다시 시도'
            onClick={() => void teamQuery.refetch()}
          />
        }
      />
    );
  if (
    !currentUser?.sections.some(
      section => section.id === teamQuery.data.sectionId,
    )
  ) {
    return (
      <EmptyState
        title='이 팀에 접근할 수 없습니다.'
        description='담당 분반과 관리자 권한을 확인해 주세요.'
      />
    );
  }
  return (
    <AdminTeamMessagesPanel
      key={`${currentUser.id}:${teamQuery.data.id}`}
      initialFilter={search.type}
      team={teamQuery.data}
    />
  );
}

export function AdminTeamMessagesPanel({
  embedded = false,
  initialFilter = 'ALL',
  team,
}: {
  embedded?: boolean;
  initialFilter?: MessageFilter;
  team: NonNullable<ReturnType<typeof useAdminTeamDashboardQuery>['data']>;
}) {
  const teamId = team.id;
  const currentUser = useAuthStore(state => state.currentUser);
  const section = currentUser?.sections.find(
    item => String(item.id) === String(team.sectionId),
  );
  const sectionLabel = section
    ? formatAdminSectionLabel(section)
    : team.sectionId;
  const messagesQuery = useTeamMessagesQuery(teamId);
  const submitMutation = useSubmitTeamMessageMutation(teamId);
  const submitMidReportFeedbackMutation =
    useSubmitAdminMidReportFeedbackMutation();
  const [message, setMessage] = useState('');
  const [messageFilter, setMessageFilter] =
    useState<MessageFilter>(initialFilter);
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<
    string | null
  >(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const messages = messagesQuery.data ?? [];
  const sectionId = team.sectionId;
  const relatedType = messageFilter === 'ALL' ? undefined : messageFilter;
  const needsProposalSubmission =
    relatedType === 'PROPOSAL' ||
    messages.some(item => item.relatedType === 'PROPOSAL');
  const needsMidReportSubmission =
    relatedType === 'MID_REPORT' ||
    messages.some(item => item.relatedType === 'MID_REPORT');
  const proposalSubmissionQuery = useAdminRelatedSubmissionQuery(
    needsProposalSubmission ? sectionId : undefined,
    needsProposalSubmission ? teamId : undefined,
    'PROPOSAL',
  );
  const midReportSubmissionQuery = useAdminRelatedSubmissionQuery(
    needsMidReportSubmission ? sectionId : undefined,
    needsMidReportSubmission ? teamId : undefined,
    'MID_REPORT',
  );
  const relatedSubmissionQuery =
    relatedType === 'MID_REPORT'
      ? midReportSubmissionQuery
      : proposalSubmissionQuery;
  const relatedSubmission = relatedSubmissionQuery.data;
  const isMidReportFeedback = relatedType === 'MID_REPORT';
  const isMidReportRevisionRequested =
    isMidReportFeedback && relatedSubmission?.status === 'REVISION_REQUESTED';
  const canRequestMidReportRevision =
    !isMidReportFeedback || relatedSubmission?.status === 'SUBMITTED';
  const isSubmitting =
    submitMutation.isPending || submitMidReportFeedbackMutation.isPending;
  const filteredMessages =
    messageFilter === 'ALL'
      ? messages
      : messages.filter(item => item.relatedType === messageFilter);
  const filteredSubmission =
    messageFilter === 'PROPOSAL'
      ? proposalSubmissionQuery.data
      : messageFilter === 'MID_REPORT'
        ? midReportSubmissionQuery.data
        : undefined;
  const hasMatchedSubmission = Boolean(
    filteredSubmission &&
    filteredMessages.some(
      item => item.relatedId === filteredSubmission.relatedId,
    ),
  );

  return (
    <section className={cx(styles.page, embedded && styles.embeddedPage)}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Text className={styles.sectionContext} color='secondary'>
            분반 {sectionLabel}
          </Text>
          <Heading level={embedded ? 2 : 1}>
            <Link
              className={styles.teamTitleLink}
              params={{ teamId: String(team.id) }}
              search={{ sectionId: team.sectionId }}
              title={`${team.name} 팀 상세 보기`}
              to={ROUTES.ADMIN_TEAM_DETAIL}
            >
              {team.name}
              <span aria-hidden='true'> ↗</span>
            </Link>{' '}
            · {messageFilterLabels[messageFilter]}
          </Heading>
        </div>
        {!embedded ? (
          <div className={styles.headerLinks}>
            <Link className={styles.backLink} to={ROUTES.ADMIN_MESSAGES}>
              ← 쪽지함 목록으로
            </Link>
          </div>
        ) : null}
      </header>
      <div aria-label='쪽지 유형' className={styles.typeActions} role='group'>
        {(Object.keys(messageFilterLabels) as MessageFilter[]).map(type => (
          <Button
            aria-pressed={messageFilter === type}
            key={type}
            label={messageFilterLabels[type]}
            onClick={() => setMessageFilter(type)}
            variant={messageFilter === type ? 'primary' : 'secondary'}
          />
        ))}
      </div>
      {filteredSubmission && hasMatchedSubmission ? (
        <div className={styles.submissionContext}>
          <Text weight='medium'>{filteredSubmission.milestoneTitle}</Text>
          <Link
            className={styles.relatedSubmissionLink}
            params={{ submissionId: String(filteredSubmission.submissionId) }}
            search={{
              apiSectionId: sectionId,
              milestoneId:
                messageFilter === 'PROPOSAL' ? 'proposal' : 'midterm',
              sectionId,
              teamId,
            }}
            to={ROUTES.ADMIN_SUBMISSION_DETAIL}
          >
            제출물 상세 보기 →
          </Link>
        </div>
      ) : null}
      {mutationError ? <Text role='alert'>{mutationError}</Text> : null}
      <Card className={styles.thread} padding={0}>
        {messagesQuery.isPending ? (
          <Text>메시지를 불러오는 중입니다.</Text>
        ) : messagesQuery.isError ? (
          <>
            <Text role='alert'>팀 대화 메시지를 불러오지 못했습니다.</Text>
            <Button
              label='메시지 다시 시도'
              onClick={() => void messagesQuery.refetch()}
            />
          </>
        ) : filteredMessages.length === 0 ? (
          <Text>이 유형의 쪽지가 없습니다.</Text>
        ) : (
          filteredMessages.map(item => {
            const isOwnMessage = item.senderId === currentUser?.studentNumber;

            return (
              <Card
                className={cx(
                  styles.message,
                  isOwnMessage && styles.ownMessage,
                )}
                key={item.id}
                padding={0}
              >
                <div className={styles.messageHeader}>
                  <Text className={styles.messageMeta}>
                    {isOwnMessage ? (
                      (item.senderName ?? item.senderId)
                    ) : (
                      <button
                        className={styles.senderButton}
                        onClick={() => setSelectedStudentNumber(item.senderId)}
                        type='button'
                      >
                        {item.senderName ?? item.senderId}
                      </button>
                    )}{' '}
                    · {formatSeoulDateTime(item.createdAt)}
                  </Text>
                </div>
                <Text className={styles.messageContent}>{item.message}</Text>
              </Card>
            );
          })
        )}
      </Card>
      <Card className={styles.composer} padding={0}>
        <div className={styles.composerType}>
          <Badge
            label={
              messageFilter === 'ALL'
                ? '유형 선택 필요'
                : messageFilterLabels[messageFilter]
            }
            variant='neutral'
          />
        </div>
        {relatedType === 'PROPOSAL' ? (
          <Text className={styles.relatedNotice}>
            {relatedSubmissionQuery.isPending
              ? '제안서 제출물을 불러오는 중입니다.'
              : relatedSubmissionQuery.isError
                ? '제안서 제출물을 불러오지 못했습니다. 다시 시도해 주세요.'
                : relatedSubmission
                  ? `${relatedSubmission.milestoneTitle} 제출물 #${relatedSubmission.submissionId}에 자동 연결됩니다.`
                  : '이 팀의 제안서 제출물을 찾지 못했습니다.'}
          </Text>
        ) : null}
        {relatedType === 'MID_REPORT' ? (
          <>
            <Text className={styles.relatedNotice}>
              {relatedSubmissionQuery.isPending
                ? '중간 보고서 제출물을 불러오는 중입니다.'
                : relatedSubmissionQuery.isError
                  ? '중간 보고서 제출물을 불러오지 못했습니다. 다시 시도해 주세요.'
                  : relatedSubmission
                    ? `${relatedSubmission.milestoneTitle} 제출물 #${relatedSubmission.submissionId}에 자동 연결됩니다.`
                    : '이 팀의 중간 보고서 제출물을 찾지 못했습니다.'}
            </Text>
            {relatedSubmission?.status === 'SUBMITTED' ? (
              <Text className={styles.relatedNotice}>
                수정 요청을 보내면 학생이 수정본을 재제출하기 전까지 추가 수정
                요청을 보낼 수 없습니다. 필요한 내용을 한 메시지에 작성해
                주세요.
              </Text>
            ) : null}
            {isMidReportRevisionRequested ? (
              <Text className={styles.relatedNotice} role='status'>
                수정 요청을 전달했습니다. 학생이 수정본을 재제출하기 전까지 추가
                수정 요청을 보낼 수 없습니다.
              </Text>
            ) : null}
          </>
        ) : null}
        <TextArea
          isDisabled={
            messageFilter === 'ALL' ||
            (isMidReportFeedback && !canRequestMidReportRevision)
          }
          isLabelHidden
          label='메시지 내용'
          onChange={setMessage}
          placeholder='팀에 전달할 내용을 입력하세요.'
          rows={3}
          value={message}
        />
        <div className={styles.messageActions}>
          <Button
            isDisabled={
              !message.trim() ||
              messageFilter === 'ALL' ||
              isSubmitting ||
              !canRequestMidReportRevision ||
              (relatedType !== 'GENERAL' && !relatedSubmission)
            }
            isLoading={isSubmitting}
            label={isMidReportFeedback ? '수정 요청 보내기' : '메시지 보내기'}
            onClick={() => {
              if (!message.trim() || !relatedType) return;
              setMutationError(null);

              if (relatedType === 'MID_REPORT') {
                if (!canRequestMidReportRevision) return;
                submitMidReportFeedbackMutation.mutate(
                  {
                    input: { message: message.trim() },
                    sectionId,
                    teamId,
                  },
                  {
                    onError: () =>
                      setMutationError(
                        '수정 요청을 보내지 못했습니다. 중간 보고서 상태를 확인한 뒤 다시 시도해 주세요.',
                      ),
                    onSuccess: async () => {
                      setMessage('');
                      await Promise.all([
                        midReportSubmissionQuery.refetch(),
                        messagesQuery.refetch(),
                      ]);
                    },
                  },
                );
                return;
              }

              submitMutation.mutate(
                {
                  message,
                  relatedType,
                  relatedId:
                    relatedType === 'GENERAL'
                      ? undefined
                      : relatedSubmission?.relatedId,
                },
                {
                  onError: () =>
                    setMutationError(
                      '메시지를 보내지 못했습니다. 다시 시도해 주세요.',
                    ),
                  onSuccess: () => setMessage(''),
                },
              );
            }}
          />
        </div>
      </Card>
      <AdminStudentDetailDialog
        onClose={() => setSelectedStudentNumber(null)}
        studentNumber={selectedStudentNumber}
      />
    </section>
  );
}

export function AdminTeamMessageList({
  team,
}: {
  team: NonNullable<ReturnType<typeof useAdminTeamDashboardQuery>['data']>;
}) {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const messagesQuery = useTeamMessagesQuery(team.id);
  const messages = messagesQuery.data ?? [];
  const sectionLabel =
    currentUser?.sections.find(section => section.id === team.sectionId)
      ?.code ?? team.sectionId;

  if (messagesQuery.isPending)
    return <Text role='status'>쪽지 목록을 불러오는 중입니다.</Text>;
  if (messagesQuery.isError)
    return <Text role='alert'>쪽지 목록을 불러오지 못했습니다.</Text>;

  return (
    <section aria-label={`${team.name} 쪽지함`}>
      <Card className={styles.listCard} padding={0}>
        {messages.length === 0 ? (
          <EmptyState title='이 팀의 쪽지가 없습니다.' />
        ) : (
          <table className={styles.messageTable}>
            <thead>
              <tr>
                <th>분반</th>
                <th>팀</th>
                <th>발신자</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(item => {
                const type: MessageFilter =
                  item.relatedType === 'GENERAL' ||
                  item.relatedType === 'PROPOSAL' ||
                  item.relatedType === 'MID_REPORT'
                    ? item.relatedType
                    : 'ALL';
                const openThread = () =>
                  void navigate({
                    params: { teamId: String(team.id) },
                    search: { type },
                    to: ROUTES.ADMIN_MESSAGE_TEAM,
                  });

                return (
                  <tr
                    aria-label={`${team.name} ${messageFilterLabels[type]} 상세 보기`}
                    className={styles.messageRow}
                    key={item.id}
                    onClick={openThread}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openThread();
                      }
                    }}
                    tabIndex={0}
                  >
                    <td>
                      {item.read ? null : (
                        <span
                          aria-label='읽지 않음'
                          className={styles.unreadDot}
                        />
                      )}
                      {sectionLabel}
                    </td>
                    <td>{team.name}</td>
                    <td>{item.senderName ?? item.senderId}</td>
                    <td>{item.message}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
}
