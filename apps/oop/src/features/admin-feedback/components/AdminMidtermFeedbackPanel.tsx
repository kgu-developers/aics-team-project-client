import type { AdminMidtermFeedbackDto } from '@aics/api-client';
import { Button, Card, Heading, Text, TextArea } from '@aics/design-system';
import { useEffect, useState } from 'react';

import * as styles from './AdminProposalFeedbackPanel.css';

type AdminMidtermFeedbackPanelProps = {
  feedback?: AdminMidtermFeedbackDto | null;
};

/** Temporary admin-only UI until the midterm feedback API contract is fixed. */
export function AdminMidtermFeedbackPanel({
  feedback = null,
}: AdminMidtermFeedbackPanelProps) {
  const latestFeedback = feedback?.history.at(-1);
  const initialFeedback = latestFeedback?.content ?? '';
  const [content, setContent] = useState(initialFeedback);
  const [savedContent, setSavedContent] = useState(initialFeedback);

  useEffect(() => {
    setContent(initialFeedback);
    setSavedContent(initialFeedback);
  }, [
    initialFeedback,
    feedback?.latestStudentResponse?.responseId,
    latestFeedback?.feedbackId,
  ]);

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <Heading level={2}>중간 점검 피드백</Heading>
        <Text className={styles.description}>
          학생이 작성한 중간 점검 질문에 대한 답변을 작성합니다.
        </Text>
      </div>
      <section className={styles.section}>
        {feedback?.latestStudentResponse ? (
          <div className={styles.response}>
            <Text className={styles.meta}>
              {feedback.latestStudentResponse.authorName} ·{' '}
              {feedback.latestStudentResponse.createdAt}
            </Text>
            <Text>{feedback.latestStudentResponse.content}</Text>
          </div>
        ) : (
          <Text>학생 답변이 없습니다.</Text>
        )}
        <TextArea
          aria-label='중간 점검 피드백'
          label='중간 점검 피드백'
          onChange={setContent}
          value={content}
        />
        <div className={styles.actions}>
          <Button
            isDisabled={!content.trim() || content === savedContent}
            label='임시 저장'
            onClick={() => setSavedContent(content)}
            type='button'
          />
          <Text className={styles.notice}>
            API 계약 확정 후 저장 요청으로 연결됩니다.
          </Text>
        </div>
      </section>
    </Card>
  );
}
