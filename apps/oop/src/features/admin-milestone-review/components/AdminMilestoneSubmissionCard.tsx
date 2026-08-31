import { Text } from '@aics/design-system';
import type { ReactNode } from 'react';

import * as readStateStyles from '~/features/admin-read-state/adminReadState.css';

import * as styles from './AdminMilestoneSubmissionCard.css';

type AdminMilestoneSubmissionCardProps = {
  action: ReactNode;
  label: string;
  meetingCountLabel: ReactNode;
  messageCountLabel: string;
  secondaryLabel: string;
  summary: ReactNode;
  isUnread?: boolean;
};

export function AdminMilestoneSubmissionCard({
  action,
  label,
  meetingCountLabel,
  messageCountLabel,
  secondaryLabel,
  summary,
  isUnread = false,
}: AdminMilestoneSubmissionCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <Text className={styles.label}>
          {isUnread ? (
            <span
              aria-label='읽지 않음'
              className={readStateStyles.unreadDot}
            />
          ) : null}
          {label}
        </Text>
        <Text className={styles.secondaryLabel}>{secondaryLabel}</Text>
      </div>
      <div className={styles.content}>
        <div className={styles.summary}>{summary}</div>
        <div className={styles.footer}>
          <div className={styles.footerMetric}>{meetingCountLabel}</div>
          <div className={styles.footerMetric}>
            <Text>{messageCountLabel}</Text>
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
