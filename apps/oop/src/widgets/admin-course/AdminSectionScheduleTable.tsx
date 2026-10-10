import { Card, EmptyState, Heading, Table, Text } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { useAdminSectionMilestonesQuery } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminSectionScheduleTable.css';

const milestoneStatusLabel = {
  CLOSED: '종료',
  DRAFT: '비공개',
  PUBLISHED: '공개',
} as const;

function formatScheduleDateTime(value: string | null | undefined) {
  return value ? formatSeoulDateTime(value) : '-';
}

export default function AdminSectionScheduleTable({
  sectionId,
}: {
  sectionId: string;
}) {
  const milestonesQuery = useAdminSectionMilestonesQuery(sectionId);
  const milestones = [...(milestonesQuery.data?.content ?? [])].sort(
    (left, right) => left.weekNumber - right.weekNumber || left.id - right.id,
  );

  return (
    <section aria-labelledby='section-schedule-heading' className={styles.root}>
      <div className={styles.header}>
        <Heading id='section-schedule-heading' level={2}>
          진행 일정
        </Heading>
      </div>

      {milestonesQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          진행 일정을 불러오는 중입니다.
        </Text>
      ) : milestonesQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='진행 일정을 불러오지 못했습니다.'
        />
      ) : (
        <Card padding={0}>
          <Table
            aria-label='분반 진행 일정'
            columns={[
              { align: 'start', header: '주차', key: 'weekNumber' },
              {
                align: 'start',
                header: '마일스톤',
                key: 'title',
                renderCell: milestone => (
                  <Link
                    aria-label={`${milestone.title} 마일스톤 상세 보기`}
                    className={styles.milestoneLink}
                    params={{ milestoneId: String(milestone.id) }}
                    search={{ sectionId: Number(sectionId) }}
                    to={ROUTES.ADMIN_MILESTONE_DETAIL}
                  >
                    {milestone.title}
                  </Link>
                ),
              },
              {
                align: 'start',
                header: '시작',
                key: 'schedule',
                renderCell: milestone =>
                  formatScheduleDateTime(milestone.schedule.opensAt),
              },
              {
                align: 'start',
                header: '마감',
                key: 'id',
                renderCell: milestone =>
                  formatScheduleDateTime(milestone.schedule.dueAt),
              },
              {
                align: 'start',
                header: '상태',
                key: 'status',
                renderCell: milestone => milestoneStatusLabel[milestone.status],
              },
            ]}
            data={milestones}
            density='balanced'
            dividers='rows'
            emptyState={<span>등록된 마일스톤이 없습니다.</span>}
            idKey='id'
            textOverflow='wrap'
            verticalAlign='middle'
          />
        </Card>
      )}
    </section>
  );
}
