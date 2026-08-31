import type { AdminProposalFeedbackDto } from '@aics/api-client';
import { Button, Card, Heading, Text, TextArea } from '@aics/design-system';
import { useEffect, useState } from 'react';

import * as styles from './AdminProposalFeedbackPanel.css';

type AdminProposalFeedbackPanelProps = {
  feedback?: AdminProposalFeedbackDto | null;
};

export function AdminProposalFeedbackPanel({
  feedback = null,
}: AdminProposalFeedbackPanelProps) {
  const history = feedback?.history ?? [];
  const latestStudentResponse = feedback?.latestStudentResponse ?? null;
  const latestFeedback = history.at(-1);
  const initialContent = latestFeedback?.content ?? '';
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
    setSavedContent(initialContent);
  }, [
    initialContent,
    latestStudentResponse?.responseId,
    latestFeedback?.feedbackId,
  ]);

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <Heading level={2}>제안서 피드백</Heading>
        <Text className={styles.description}>
          학생에게 전달할 피드백과 최신 답변을 확인합니다.
        </Text>
      </div>

      <section className={styles.section}>
        <Heading level={3}>피드백 이력</Heading>
        {history.length ? (
          <div className={styles.historyList}>
            {history.map(entry => (
              <div className={styles.historyItem} key={entry.feedbackId}>
                <Text className={styles.meta}>
                  {entry.authorName} · {entry.createdAt}
                </Text>
                <Text>{entry.content}</Text>
              </div>
            ))}
          </div>
        ) : (
          <Text className={styles.empty}>등록된 피드백이 없습니다.</Text>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.response}>
          {latestStudentResponse ? (
            <>
              <Text className={styles.meta}>
                {latestStudentResponse.authorName} ·{' '}
                {latestStudentResponse.createdAt}
              </Text>
              <Text>{latestStudentResponse.content}</Text>
            </>
          ) : (
            <Text>학생 답변이 없습니다.</Text>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <TextArea
          aria-label='제안서 피드백'
          label='제안서 피드백'
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
