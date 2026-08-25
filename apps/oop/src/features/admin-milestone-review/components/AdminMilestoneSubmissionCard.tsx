import { Text } from '@aics/design-system';
import type { ReactNode } from 'react';

import * as styles from './AdminMilestoneSubmissionCard.css';

type AdminMilestoneSubmissionCardProps = {
  detailAction: ReactNode;
  label: string;
  meetingCountLabel: string;
  messageCountLabel: string;
  secondaryLabel: string;
  summary: ReactNode;
};

export function AdminMilestoneSubmissionCard({
  detailAction,
  label,
  meetingCountLabel,
  messageCountLabel,
  secondaryLabel,
  summary,
}: AdminMilestoneSubmissionCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.meta}>
        <Text className={styles.label}>{label}</Text>
        <Text className={styles.secondaryLabel}>{secondaryLabel}</Text>
      </div>
      <div className={styles.content}>
        <div className={styles.summary}>{summary}</div>
        <div className={styles.footer}>
          <div className={styles.footerMetric}>
            <Text>{meetingCountLabel}</Text>
          </div>
          <div className={styles.footerMetric}>
            <Text>{messageCountLabel}</Text>
          </div>
          {detailAction}
        </div>
      </div>
    </article>
  );
}
