import { Button, Text, TextArea } from '@aics/design-system';
import { useEffect, useState } from 'react';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  useAdminMidReportFeedbacksQuery,
  useAdminProposalFeedbacksQuery,
  useSubmitAdminMidReportFeedbackMutation,
  useSubmitAdminProposalFeedbackMutation,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminSubmissionFeedbackHistory.css';

type AdminSubmissionFeedbackHistoryProps = {
  id: string;
  milestoneId: 'midterm' | 'proposal';
  onOpenGeneralMessage: () => void;
  sectionId: string;
  teamId: string;
  teamName: string;
};

function getFeedbackDraftStorageKey(
  milestoneId: 'midterm' | 'proposal',
  sectionId: string,
  teamId: string,
  userId: string,
) {
  return `aics.oop.admin.submission-feedback-draft:${userId}:${milestoneId}:${sectionId}:${teamId}`;
}

function readFeedbackDraft(storageKey: string) {
  try {
    return sessionStorage.getItem(storageKey) ?? '';
  } catch {
    return '';
  }
}

function storeFeedbackDraft(storageKey: string, message: string) {
  try {
    if (message) sessionStorage.setItem(storageKey, message);
    else sessionStorage.removeItem(storageKey);
  } catch {
    // Storage can be unavailable in privacy mode. Draft persistence must not
    // break the feedback composer itself.
  }
}

export function AdminSubmissionFeedbackHistory({
  id,
  milestoneId,
  onOpenGeneralMessage,
  sectionId,
  teamId,
  teamName,
}: AdminSubmissionFeedbackHistoryProps) {
  const currentUser = useAuthStore(state => state.currentUser);
  const draftStorageKey = currentUser?.studentNumber
    ? getFeedbackDraftStorageKey(
        milestoneId,
        sectionId,
        teamId,
        currentUser.studentNumber,
      )
    : null;
  const [page, setPage] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState(() =>
    draftStorageKey ? readFeedbackDraft(draftStorageKey) : '',
  );
  const [loadedDraftStorageKey, setLoadedDraftStorageKey] =
    useState(draftStorageKey);
  const proposalFeedbacksQuery = useAdminProposalFeedbacksQuery(
    milestoneId === 'proposal' ? sectionId : undefined,
    milestoneId === 'proposal' ? teamId : undefined,
    page,
  );
  const midReportFeedbacksQuery = useAdminMidReportFeedbacksQuery(
    milestoneId === 'midterm' ? sectionId : undefined,
    milestoneId === 'midterm' ? teamId : undefined,
    page,
  );
  const feedbacksQuery =
    milestoneId === 'proposal'
      ? proposalFeedbacksQuery
      : midReportFeedbacksQuery;
  const feedbacks = [...(feedbacksQuery.data?.contents ?? [])].sort(
    (left, right) => left.messageId - right.messageId,
  );
  const pageable = feedbacksQuery.data?.pageable;
  const submitProposalFeedbackMutation =
    useSubmitAdminProposalFeedbackMutation();
  const submitMidReportFeedbackMutation =
    useSubmitAdminMidReportFeedbackMutation();
  const isSubmitting =
    submitProposalFeedbackMutation.isPending ||
    submitMidReportFeedbackMutation.isPending;
  const isSubmitError =
    submitProposalFeedbackMutation.isError ||
    submitMidReportFeedbackMutation.isError;

  useEffect(() => {
    setFeedbackMessage(
      draftStorageKey ? readFeedbackDraft(draftStorageKey) : '',
    );
    setLoadedDraftStorageKey(draftStorageKey);
  }, [draftStorageKey]);

  useEffect(() => {
    if (draftStorageKey && loadedDraftStorageKey === draftStorageKey) {
      storeFeedbackDraft(draftStorageKey, feedbackMessage);
    }
  }, [draftStorageKey, feedbackMessage, loadedDraftStorageKey]);

  async function submitFeedback() {
    const submittedDraft = feedbackMessage;
    const message = feedbackMessage.trim();
    if (!message || isSubmitting) return;

    try {
      if (milestoneId === 'proposal') {
        await submitProposalFeedbackMutation.mutateAsync({
          input: { message },
          sectionId,
          teamId,
        });
      } else {
        await submitMidReportFeedbackMutation.mutateAsync({
          input: { message },
          sectionId,
          teamId,
        });
      }
    } catch {
      return;
    }

    if (
      draftStorageKey &&
      readFeedbackDraft(draftStorageKey) === submittedDraft
    ) {
      storeFeedbackDraft(draftStorageKey, '');
    }
    setFeedbackMessage(current => (current === submittedDraft ? '' : current));
    setPage(0);
  }

  return (
    <section aria-label='피드백 기록' className={styles.history} id={id}>
      <Text weight='medium'>피드백 기록</Text>
      {feedbacksQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          피드백을 불러오는 중입니다.
        </Text>
      ) : feedbacksQuery.isError ? (
        <>
          <Text role='alert'>피드백을 불러오지 못했습니다.</Text>
          <Button
            label='다시 시도'
            onClick={() => {
              void feedbacksQuery.refetch();
            }}
            type='button'
            variant='secondary'
          />
        </>
      ) : feedbacks.length === 0 ? (
        <Text>등록된 피드백이 없습니다.</Text>
      ) : (
        <div className={styles.feedbackThread}>
          {feedbacks.map(feedback => (
            <article
              className={cx(
                styles.feedbackMessage,
                feedback.senderId === currentUser?.studentNumber &&
                  styles.feedbackOwnMessage,
              )}
              key={feedback.messageId}
            >
              <Text className={styles.feedbackMessageMeta}>
                {feedback.senderName ?? feedback.senderId} ·{' '}
                {feedback.createdAt
                  ? formatSeoulDateTime(feedback.createdAt)
                  : '-'}
              </Text>
              <Text className={styles.feedbackMessageContent}>
                {feedback.message}
              </Text>
            </article>
          ))}
        </div>
      )}
      {pageable && pageable.totalPages > 1 ? (
        <div className={styles.pagination}>
          <Button
            isDisabled={pageable.page === 0 || feedbacksQuery.isFetching}
            label='최신 기록'
            onClick={() => setPage(current => Math.max(0, current - 1))}
            type='button'
            variant='secondary'
          />
          <Text aria-live='polite'>
            {pageable.page + 1} / {pageable.totalPages}
          </Text>
          <Button
            isDisabled={pageable.isEnd || feedbacksQuery.isFetching}
            label='이전 기록'
            onClick={() => setPage(current => current + 1)}
            type='button'
            variant='secondary'
          />
        </div>
      ) : null}
      <div className={styles.feedbackComposer}>
        <TextArea
          aria-label={`${milestoneId === 'proposal' ? '제안서' : '중간 보고서'} 피드백 내용`}
          label={`${milestoneId === 'proposal' ? '제안서' : '중간 보고서'} 피드백 작성`}
          onChange={setFeedbackMessage}
          placeholder={`${teamName}에 전달할 피드백을 입력하세요.`}
          value={feedbackMessage}
        />
        {isSubmitError ? (
          <Text role='alert'>
            피드백을 보내지 못했습니다. 입력 내용을 확인한 뒤 다시 시도해
            주세요.
          </Text>
        ) : null}
        <div className={styles.feedbackSubmitAction}>
          <Button
            label='일반 메시지 보내기'
            onClick={onOpenGeneralMessage}
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={!feedbackMessage.trim() || isSubmitting}
            isLoading={isSubmitting}
            label={
              milestoneId === 'proposal' ? '피드백 보내기' : '수정 요청 보내기'
            }
            onClick={() => void submitFeedback()}
            type='button'
          />
        </div>
      </div>
    </section>
  );
}
