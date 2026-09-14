import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  IconButton,
  Text,
  TextArea,
} from '@aics/design-system';
import { Link, useParams } from '@tanstack/react-router';
import { Star } from 'lucide-react';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  useAdminRelatedSubmissionQuery,
  useUpdateTeamMessageImportantMutation,
} from '~/features/admin-message/queries';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
import { useAdminTeamDashboardQuery } from '~/features/admin-team-dashboard/queries';
import { useAuthStore } from '~/features/auth/authStore';
import {
  useSubmitTeamMessageMutation,
  useTeamMessagesQuery,
} from '~/features/team-message/queries';

import * as styles from './AdminTeamMessagesPage.css';

type RelatedType = 'GENERAL' | 'PROPOSAL' | 'MID_REPORT';

const relatedTypeLabels: Record<RelatedType, string> = {
  GENERAL: '일반 메시지',
  PROPOSAL: '제안서 피드백',
  MID_REPORT: '중간점검 피드백',
};

export default function AdminTeamMessagesPage() {
  const { teamId } = useParams({ from: '/admin/messages/teams/$teamId' });
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
    <TeamMessages
      key={`${currentUser.id}:${teamQuery.data.id}`}
      team={teamQuery.data}
    />
  );
}

function TeamMessages({
  team,
}: {
  team: NonNullable<ReturnType<typeof useAdminTeamDashboardQuery>['data']>;
}) {
  const teamId = team.id;
  const currentUser = useAuthStore(state => state.currentUser);
  const messagesQuery = useTeamMessagesQuery(teamId);
  const submitMutation = useSubmitTeamMessageMutation(teamId);
  const importantMutation = useUpdateTeamMessageImportantMutation(teamId);
  const [message, setMessage] = useState('');
  const [relatedType, setRelatedType] = useState<RelatedType>('GENERAL');
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<
    string | null
  >(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const messages = messagesQuery.data ?? [];
  const sectionId = team.sectionId;
  const feedbackType = relatedType === 'GENERAL' ? undefined : relatedType;
  const relatedSubmissionQuery = useAdminRelatedSubmissionQuery(
    sectionId,
    teamId,
    feedbackType,
  );
  const relatedSubmission = relatedSubmissionQuery.data;
  const title = team.name;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Heading level={1}>{title} 대화</Heading>
          <Text>팀과 주고받은 메시지와 피드백을 확인합니다.</Text>
        </div>
        <div className={styles.headerActions}>
          <Badge label={`메시지 ${messages.length}개`} variant='neutral' />
          <Link className={styles.backLink} to={ROUTES.ADMIN_MESSAGES}>
            ← 쪽지함 목록으로
          </Link>
        </div>
      </header>
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
        ) : messages.length === 0 ? (
          <Text>아직 주고받은 메시지가 없습니다.</Text>
        ) : (
          messages.map(item => {
            const isOwnMessage = item.senderId === currentUser?.studentNumber;

            return (
              <Card
                className={cx(
                  styles.message,
                  isOwnMessage && styles.ownMessage,
                  item.important && styles.importantMessage,
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
                  <IconButton
                    icon={
                      <Star
                        aria-hidden='true'
                        fill={item.important ? 'currentColor' : 'none'}
                        size={16}
                      />
                    }
                    label={
                      item.important ? '중요 메시지 해제' : '중요 메시지로 표시'
                    }
                    onClick={() => {
                      setMutationError(null);
                      importantMutation.mutate(
                        {
                          messageId: item.id,
                          important: !item.important,
                        },
                        {
                          onError: () =>
                            setMutationError(
                              '중요 표시를 변경하지 못했습니다. 다시 시도해 주세요.',
                            ),
                        },
                      );
                    }}
                    isDisabled={importantMutation.isPending}
                    size='sm'
                    variant='ghost'
                  />
                </div>
                <Text>{item.message}</Text>
              </Card>
            );
          })
        )}
      </Card>
      <Card className={styles.composer} padding={0}>
        <div>
          <Heading level={2}>메시지 작성</Heading>
          <Text>
            메시지 유형을 선택하면 관련 제출물 정보가 함께 기록됩니다.
          </Text>
        </div>
        <div
          aria-label='메시지 관련 유형'
          className={styles.typeActions}
          role='group'
        >
          {(Object.keys(relatedTypeLabels) as RelatedType[]).map(type => (
            <Button
              aria-pressed={relatedType === type}
              className={styles.typeButton}
              key={type}
              label={relatedTypeLabels[type]}
              onClick={() => setRelatedType(type)}
              variant={relatedType === type ? 'primary' : 'secondary'}
            />
          ))}
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
          <Text className={styles.relatedNotice}>
            {relatedSubmissionQuery.isPending
              ? '중간점검 제출물을 불러오는 중입니다.'
              : relatedSubmissionQuery.isError
                ? '중간점검 제출물을 불러오지 못했습니다. 다시 시도해 주세요.'
                : relatedSubmission
                  ? `${relatedSubmission.milestoneTitle} 제출물 #${relatedSubmission.submissionId}에 자동 연결됩니다.`
                  : '이 팀의 중간점검 제출물을 찾지 못했습니다.'}
          </Text>
        ) : null}
        <TextArea
          aria-label='메시지 내용'
          label='내용'
          onChange={setMessage}
          placeholder='팀에 전달할 내용을 입력하세요.'
          value={message}
        />
        <div className={styles.messageActions}>
          <Button
            isDisabled={
              !message.trim() ||
              submitMutation.isPending ||
              (relatedType !== 'GENERAL' && !relatedSubmission)
            }
            isLoading={submitMutation.isPending}
            label='메시지 보내기'
            onClick={() => {
              if (!message.trim()) return;
              setMutationError(null);
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
    </main>
  );
}
