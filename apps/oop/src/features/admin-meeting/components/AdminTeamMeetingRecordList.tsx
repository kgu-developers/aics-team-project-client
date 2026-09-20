import type { AdminMeetingRecordSummaryDto } from '@aics/api-client';
import { Card, EmptyState, Heading, Text } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { AdminUnreadDot } from '~/shared/ui/AdminUnreadDot';

import { useAdminMeetingReadState } from '~/features/admin-meeting-read/useAdminMeetingReadState';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminTeamMeetingRecordList.css';

type AdminTeamMeetingRecordListProps = {
  isError: boolean;
  isPending: boolean;
  records: AdminMeetingRecordSummaryDto[];
  sectionId: string;
  teamId: string;
};

export function AdminTeamMeetingRecordList({
  isError,
  isPending,
  records,
  sectionId,
  teamId,
}: AdminTeamMeetingRecordListProps) {
  const currentUser = useAuthStore(state => state.currentUser);
  const { isRead, markAsRead } = useAdminMeetingReadState(currentUser?.id);

  return (
    <section aria-labelledby='team-meetings-heading' className={styles.section}>
      <div className={styles.header}>
        <Heading id='team-meetings-heading' level={2}>
          회의록
        </Heading>
        <Link
          className={styles.allLink}
          search={{ sectionId, teamId }}
          to={ROUTES.ADMIN_MEETINGS}
        >
          전체보기 →
        </Link>
      </div>

      {isPending ? (
        <Text aria-live='polite' role='status'>
          회의록을 불러오는 중입니다.
        </Text>
      ) : isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          headingLevel={3}
          title='회의록을 불러오지 못했습니다.'
        />
      ) : records.length === 0 ? (
        <EmptyState
          description='이 팀이 작성한 회의록이 없습니다.'
          headingLevel={3}
          title='등록된 회의록이 없습니다.'
        />
      ) : (
        <Card className={styles.list} padding={0}>
          {records.slice(0, 3).map(record => (
            <Link
              className={styles.record}
              key={record.id}
              params={{ meetingId: record.id }}
              onClick={() => markAsRead(record.id)}
              search={{ sectionId: record.sectionId, teamId: record.teamId }}
              to={ROUTES.ADMIN_MEETING_DETAIL}
            >
              <div className={styles.recordMain}>
                {!isRead(record.id) ? <AdminUnreadDot /> : null}
                <Text className={styles.team}>
                  {record.sectionLabel} · {record.teamLabel}
                </Text>
                <Text className={styles.title}>{record.title}</Text>
              </div>
              <Text className={styles.date}>
                {formatSeoulDateTime(record.createdAt)}
              </Text>
            </Link>
          ))}
        </Card>
      )}
    </section>
  );
}
