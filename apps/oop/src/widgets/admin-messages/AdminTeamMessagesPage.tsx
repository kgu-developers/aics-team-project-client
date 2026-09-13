import {
  Badge,
  Button,
  Card,
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

import {
  useAdminMessagesQuery,
  useAdminRelatedSubmissionQuery,
  useUpdateTeamMessageImportantMutation,
} from '~/features/admin-message/queries';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
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
  const adminMessagesQuery = useAdminMessagesQuery();
  const messagesQuery = useTeamMessagesQuery(teamId);
  const submitMutation = useSubmitTeamMessageMutation(teamId);
  const importantMutation = useUpdateTeamMessageImportantMutation(teamId);
  const [message, setMessage] = useState('');
  const [relatedType, setRelatedType] = useState<RelatedType>('GENERAL');
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<
    string | null
  >(null);
  const messages = messagesQuery.data ?? [];
  const teamMessage = adminMessagesQuery.data?.contents.find(
    item => String(item.teamId) === teamId,
  );
  const sectionId = teamMessage ? String(teamMessage.sectionId) : undefined;
  const feedbackType = relatedType === 'GENERAL' ? undefined : relatedType;
  const relatedSubmissionQuery = useAdminRelatedSubmissionQuery(
    sectionId,
    teamId,
    feedbackType,
  );
  const relatedSubmission = relatedSubmissionQuery.data;
  const title = teamMessage?.teamName ?? `${teamId}팀`;

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
      <Card className={styles.thread} padding={0}>
        {messagesQuery.isPending ? (
          <Text>메시지를 불러오는 중입니다.</Text>
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
                    · {item.createdAt}
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
                    onClick={() =>
                      importantMutation.mutate({
                        messageId: item.id,
                        important: !item.important,
                      })
                    }
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
              : relatedSubmission
                ? `${relatedSubmission.milestoneTitle} 제출물 #${relatedSubmission.submissionId}에 자동 연결됩니다.`
                : '이 팀의 제안서 제출물을 찾지 못했습니다.'}
          </Text>
        ) : null}
        {relatedType === 'MID_REPORT' ? (
          <Text className={styles.relatedNotice}>
            {relatedSubmissionQuery.isPending
              ? '중간점검 제출물을 불러오는 중입니다.'
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
              (relatedType !== 'GENERAL' && !relatedSubmission)
            }
            label='메시지 보내기'
            onClick={() => {
              if (!message.trim()) return;
              submitMutation.mutate(
                {
                  message,
                  relatedType,
                  relatedId:
                    relatedType === 'GENERAL'
                      ? undefined
                      : relatedSubmission?.submissionId,
                },
                { onSuccess: () => setMessage('') },
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
