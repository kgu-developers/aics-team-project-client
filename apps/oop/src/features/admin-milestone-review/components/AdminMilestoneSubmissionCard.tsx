import { Badge, HStack, Text } from '@aics/design-system';
import type { ReactNode } from 'react';

import { AdminUnreadDot } from '~/shared/ui/AdminUnreadDot';

import * as styles from './AdminMilestoneSubmissionCard.css';

type AdminMilestoneSubmissionCardProps = {
  action: ReactNode;
  isUnread?: boolean;
  label: string;
  leaderName?: string | null;
  meetingCountLabel?: ReactNode;
  messageCountLabel?: string;
  secondaryLabel: string;
  submissionMetadata?: ReactNode;
  summary: ReactNode;
};

export function AdminMilestoneSubmissionCard({
  action,
  isUnread = false,
  label,
  leaderName,
  meetingCountLabel,
  messageCountLabel,
  secondaryLabel,
  submissionMetadata,
  summary,
}: AdminMilestoneSubmissionCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <HStack align='center' gap={2} wrap='wrap'>
          <Text className={styles.label}>
            {isUnread ? <AdminUnreadDot /> : null}
            {label}
          </Text>
          {leaderName ? (
            <Badge label={`팀장 ${leaderName}`} variant='neutral' />
          ) : null}
        </HStack>
        <Text className={styles.secondaryLabel}>{secondaryLabel}</Text>
        {submissionMetadata ? (
          <div className={styles.submissionMetadata}>{submissionMetadata}</div>
        ) : null}
      </div>
      <div className={styles.content}>
        <div className={styles.summary}>{summary}</div>
        <div className={styles.footer}>
          {meetingCountLabel ? (
            <div className={styles.footerMetric}>{meetingCountLabel}</div>
          ) : null}
          {messageCountLabel ? (
            <div className={styles.footerMetric}>
              <Text>{messageCountLabel}</Text>
            </div>
          ) : null}
          {action}
        </div>
      </div>
    </article>
  );
}
