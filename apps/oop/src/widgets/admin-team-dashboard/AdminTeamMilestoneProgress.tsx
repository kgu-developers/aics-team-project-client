import {
  Card,
  EmptyState,
  Heading,
  StatusDot,
  type StatusDotVariant,
} from '@aics/design-system';

import type {
  TeamMilestoneProgress,
  TeamMilestoneProgressStatus,
} from '~/features/admin-team-dashboard/model';

import * as styles from './AdminTeamMilestoneProgress.css';

type AdminTeamMilestoneProgressProps = {
  milestones: TeamMilestoneProgress[];
};

type MilestoneStatusContent = {
  label: string;
  variant: StatusDotVariant;
};

function getMilestoneStatusContent(
  status: TeamMilestoneProgressStatus,
): MilestoneStatusContent {
  switch (status.kind) {
    case 'before-deadline':
      return { label: '제출 전', variant: 'neutral' };
    case 'not-submitted':
      return { label: '미제출', variant: 'warning' };
    case 'submitted':
      return {
        label: `${status.submittedDateLabel} 제출`,
        variant: 'success',
      };
    case 'evaluated':
      return { label: '평가 완료', variant: 'accent' };
  }
}

export default function AdminTeamMilestoneProgress({
  milestones,
}: AdminTeamMilestoneProgressProps) {
  return (
    <section className={styles.section}>
      <Heading level={2}>진행 현황</Heading>

      {milestones.length === 0 ? (
        <EmptyState
          description='분반에 마일스톤이 등록되면 팀 진행 현황을 확인할 수 있습니다.'
          headingLevel={3}
          title='등록된 마일스톤이 없습니다.'
        />
      ) : (
        <div className={styles.list}>
          {milestones.map(milestone => {
            const statusContent = getMilestoneStatusContent(milestone.status);

            return (
              <article key={milestone.id}>
                <Card className={styles.card} padding={0}>
                  <div className={styles.cardHeader}>
                    <Heading level={3}>{milestone.title}</Heading>
                    <span className={styles.deadline}>
                      마감 {milestone.deadlineLabel}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.status}>
                      <StatusDot
                        label={statusContent.label}
                        variant={statusContent.variant}
                      />
                      <span>{statusContent.label}</span>
                    </div>
                  </div>
                </Card>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
