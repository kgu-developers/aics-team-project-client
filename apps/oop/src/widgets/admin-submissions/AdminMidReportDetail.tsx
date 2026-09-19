import {
  Button,
  Card,
  EmptyState,
  Heading,
  Pagination,
  Text,
  TextArea,
} from '@aics/design-system';
import { useState } from 'react';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { AdminLinkedMeetingsTable } from '~/features/admin-meeting/components';
import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import {
  useAdminMidReportFeedbacksQuery,
  useAdminMidReportQuery,
  useAdminProposalFeedbacksQuery,
  useSubmitAdminMidReportFeedbackMutation,
} from '~/features/admin-milestone-review/queries';

import * as styles from './AdminSubmissionDetailPage.css';

function formatBlockFields(fields: unknown) {
  if (typeof fields === 'string') return fields;

  try {
    return JSON.stringify(fields, null, 2);
  } catch {
    return '작성 내용을 표시할 수 없습니다.';
  }
}

type Props = {
  sectionId: string;
  teamId: string;
};

export function AdminMidReportDetail({ sectionId, teamId }: Props) {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(0);
  const [proposalFeedbackPage, setProposalFeedbackPage] = useState(0);
  const reportQuery = useAdminMidReportQuery(sectionId, teamId);
  const feedbacksQuery = useAdminMidReportFeedbacksQuery(
    sectionId,
    teamId,
    feedbackPage,
  );
  const proposalFeedbacksQuery = useAdminProposalFeedbacksQuery(
    sectionId,
    teamId,
    proposalFeedbackPage,
  );
  const submitFeedbackMutation = useSubmitAdminMidReportFeedbackMutation();
  const report = reportQuery.data;
  const relatedMeetingsQuery = useAdminMeetingRecordListQuery(
    [sectionId],
    {
      page: 0,
      sectionId,
      size: 100,
      teamId,
    },
    Boolean(report),
  );
  const feedbackPageable = feedbacksQuery.data?.pageable;
  const proposalFeedbackPageable = proposalFeedbacksQuery.data?.pageable;
  const relatedMeetings = (relatedMeetingsQuery.data?.contents ?? []).filter(
    record => record.phase === 'MID_CHECK',
  );

  if (reportQuery.isPending) {
    return (
      <Text aria-live='polite' role='status'>
        중간보고서를 불러오는 중입니다.
      </Text>
    );
  }

  if (reportQuery.isError || !report) {
    return (
      <EmptyState
        description='제출 상태와 담당 분반을 확인한 뒤 다시 시도해 주세요.'
        title='중간보고서를 불러오지 못했습니다.'
      />
    );
  }

  return (
    <>
      <Card className={styles.document}>
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>MID REPORT / READ ONLY</Text>
          <Heading level={2}>{report.title}</Heading>
          <Text className={styles.metadata}>
            상태: {report.status} · 현재 버전: {report.version}차
          </Text>
        </div>
        <section className={styles.section}>
          <Heading level={3}>제출 현황</Heading>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>팀</Text>
              <Text className={styles.fieldValue}>{report.teamName}</Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>제출자</Text>
              <Text className={styles.fieldValue}>
                {report.submittedByName ?? report.submittedBy ?? '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>팀장</Text>
              <Text className={styles.fieldValue}>
                {report.leaderName ?? '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>제출 일시</Text>
              <Text className={styles.fieldValue}>
                {report.submittedAt ?? '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>마감 일시</Text>
              <Text className={styles.fieldValue}>{report.dueDate ?? '-'}</Text>
            </div>
          </div>
        </section>
        {report.blocks.map(block => (
          <section className={styles.section} key={block.key}>
            <Heading level={3}>{block.title}</Heading>
            <Text className={styles.metadata}>
              상태: {block.status} · 마지막 편집:{' '}
              {block.lastEditedByName ?? block.lastEditedBy ?? '-'} ·{' '}
              {block.lastSavedAt ?? '-'}
            </Text>
            <pre className={styles.fieldValue}>
              {formatBlockFields(block.fields)}
            </pre>
          </section>
        ))}
      </Card>
      <Card className={styles.relatedMeetings}>
        <Heading level={3}>이전 단계 제안서 피드백</Heading>
        {proposalFeedbacksQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            이전 단계 피드백을 불러오는 중입니다.
          </Text>
        ) : proposalFeedbacksQuery.isError ? (
          <Text role='alert'>이전 단계 피드백을 불러오지 못했습니다.</Text>
        ) : proposalFeedbacksQuery.data?.contents.length ? (
          <div className={styles.feedbackList}>
            {proposalFeedbacksQuery.data.contents.map(feedback => (
              <article
                className={styles.feedbackMessage}
                key={feedback.messageId}
              >
                <Text className={styles.fieldLabel}>
                  {feedback.senderName ?? feedback.senderId} ·{' '}
                  {feedback.createdAt
                    ? formatSeoulDateTime(feedback.createdAt)
                    : '-'}
                </Text>
                <Text className={styles.fieldValue}>{feedback.message}</Text>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.sectionDescription}>
            제안서 단계에 등록된 피드백이 없습니다.
          </Text>
        )}
        {proposalFeedbackPageable && proposalFeedbackPageable.totalPages > 1 ? (
          <Pagination
            className={styles.feedbackPagination}
            isDisabled={proposalFeedbacksQuery.isFetching}
            onChange={page => setProposalFeedbackPage(page - 1)}
            page={proposalFeedbackPageable.page + 1}
            pageSize={proposalFeedbackPageable.size}
            totalPages={proposalFeedbackPageable.totalPages}
            variant='compact'
          />
        ) : null}
      </Card>
      <Card className={styles.relatedMeetings}>
        <Heading level={3}>중간 점검 피드백</Heading>
        {feedbacksQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            피드백을 불러오는 중입니다.
          </Text>
        ) : feedbacksQuery.isError ? (
          <Text role='alert'>피드백을 불러오지 못했습니다.</Text>
        ) : feedbacksQuery.data?.contents.length ? (
          <div className={styles.feedbackList}>
            {feedbacksQuery.data.contents.map(feedback => (
              <article
                className={styles.feedbackMessage}
                key={feedback.messageId}
              >
                <Text className={styles.fieldLabel}>
                  {feedback.senderName ?? feedback.senderId} ·{' '}
                  {feedback.createdAt
                    ? formatSeoulDateTime(feedback.createdAt)
                    : '-'}
                </Text>
                <Text className={styles.fieldValue}>{feedback.message}</Text>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.sectionDescription}>
            등록된 피드백이 없습니다.
          </Text>
        )}
        {feedbackPageable && feedbackPageable.totalPages > 1 ? (
          <Pagination
            className={styles.feedbackPagination}
            isDisabled={feedbacksQuery.isFetching}
            onChange={page => setFeedbackPage(page - 1)}
            page={feedbackPageable.page + 1}
            pageSize={feedbackPageable.size}
            totalPages={feedbackPageable.totalPages}
            variant='compact'
          />
        ) : null}
        <div className={styles.feedbackComposer}>
          <TextArea
            aria-label='중간 점검 피드백 내용'
            label='중간 점검 피드백 작성'
            onChange={setFeedbackMessage}
            placeholder={`${report.teamName}에 전달할 피드백을 입력하세요.`}
            value={feedbackMessage}
          />
          <div className={styles.feedbackSubmitAction}>
            <Button
              isDisabled={
                !feedbackMessage.trim() ||
                submitFeedbackMutation.isPending ||
                report.status !== 'SUBMITTED'
              }
              isLoading={submitFeedbackMutation.isPending}
              label='수정 요청 보내기'
              onClick={() =>
                submitFeedbackMutation.mutate(
                  {
                    input: { message: feedbackMessage.trim() },
                    sectionId,
                    teamId,
                  },
                  { onSuccess: () => setFeedbackMessage('') },
                )
              }
              type='button'
            />
          </div>
          {report.status !== 'SUBMITTED' ? (
            <Text className={styles.sectionDescription}>
              제출 완료된 중간보고서에만 수정 요청을 보낼 수 있습니다.
            </Text>
          ) : null}
        </div>
      </Card>
      <section className={styles.relatedMeetings}>
        <Heading level={3}>연결된 회의록 ({relatedMeetings.length}건)</Heading>
        {relatedMeetingsQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            회의록을 불러오는 중입니다.
          </Text>
        ) : relatedMeetingsQuery.isError ? (
          <Text role='alert'>연결된 회의록을 불러오지 못했습니다.</Text>
        ) : relatedMeetings.length ? (
          <AdminLinkedMeetingsTable
            authorLabel='작성자 학번'
            records={relatedMeetings.map(record => ({
              authorName: record.authorId,
              id: record.id,
              meetingAt: record.meetingAt,
              participantCount: record.participantCount,
              title: record.title,
            }))}
          />
        ) : (
          <Text className={styles.sectionDescription}>
            연결된 회의록이 없습니다.
          </Text>
        )}
      </section>
    </>
  );
}
