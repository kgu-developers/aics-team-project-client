import { Button, Card, Heading, Text, TextArea } from '@aics/design-system';
import { useState } from 'react';

import * as styles from './AdminProposalFeedbackPanel.css';

type AdminMidtermFeedbackPanelProps = {
  initialFeedback?: string;
};

/** Temporary admin-only UI until the midterm feedback API contract is fixed. */
export function AdminMidtermFeedbackPanel({
  initialFeedback = '',
}: AdminMidtermFeedbackPanelProps) {
  const [content, setContent] = useState(initialFeedback);
  const [savedContent, setSavedContent] = useState(initialFeedback);

  return (
    <Card className={styles.panel}>
      <div className={styles.header}>
        <Heading level={2}>중간 점검 피드백</Heading>
        <Text className={styles.description}>
          학생이 작성한 중간 점검 질문에 대한 답변을 작성합니다.
        </Text>
      </div>
      <section className={styles.section}>
        <Heading level={3}>대면 점검 질문 답변</Heading>
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
