import type { StudentHomeTopicCandidate } from '@aics/core';
import { Badge } from '@aics/design-system';

import { cx } from '~/shared/lib/cx';

import * as styles from './TopicCandidateCard.css';

type TopicCandidateCardProps = {
  candidate: StudentHomeTopicCandidate;
};

export default function TopicCandidateCard({
  candidate,
}: TopicCandidateCardProps) {
  const headerBadge = candidate.isMyVote
    ? { className: styles.badgeBlue, label: '내 투표' }
    : candidate.isMine
      ? { className: styles.badgeLight, label: '내 주제' }
      : null;

  return (
    <div
      className={cx(styles.topic, candidate.isMyVote ? styles.topicVoted : '')}
    >
      <div className={styles.topicHeader}>
        <p className={styles.topicTitle}>{candidate.title}</p>
        {headerBadge ? (
          <Badge
            className={cx(styles.badge, headerBadge.className)}
            label={headerBadge.label}
          />
        ) : null}
      </div>
      <p className={styles.topicProposer}>제안자 {candidate.proposer}</p>
      <p className={styles.topicDesc}>{candidate.description}</p>
      <div className={styles.topicSpacer} />
      <Badge
        className={cx(
          styles.badge,
          candidate.isMyVote ? styles.badgeBlue : styles.badgeLight,
        )}
        label={`${candidate.voteCount}표`}
      />
    </div>
  );
}
