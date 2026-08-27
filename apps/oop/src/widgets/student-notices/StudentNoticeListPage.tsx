import type { SectionAnnouncement } from '@aics/core';
import {
  Badge,
  Card,
  Heading,
  Table,
  Text,
  proportional,
} from '@aics/design-system';
import type { TableColumn } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { useAuthStore } from '~/features/auth/authStore';
import { useSectionAnnouncementsQuery } from '~/features/student-notices/queries';
import { useStudentNoticeReadState } from '~/features/student-notices/useStudentNoticeReadState';

import * as styles from './StudentNoticePages.css';

function createStudentNoticeColumns(
  isRead: (noticeId: string) => boolean,
): TableColumn<SectionAnnouncement>[] {
  return [
    {
      key: 'createdAt',
      header: '날짜',
      width: proportional(1),
      renderCell: item => <>{item.createdAt.slice(0, 10)}</>,
    },
    {
      key: 'title',
      header: '제목',
      width: proportional(2),
      renderCell: item => (
        <div className={styles.titleCell}>
          <Link
            className={styles.titleLink}
            params={{ noticeId: item.id }}
            to='/student/notices/$noticeId'
          >
            {item.title}
          </Link>
          {!isRead(item.id) ? <Badge label='새 글' variant='info' /> : null}
        </div>
      ),
    },
    {
      key: 'authorName',
      header: '작성자',
      width: proportional(1),
    },
  ];
}

export default function StudentNoticeListPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const userId = currentUser?.id ?? '';
  const sectionId = currentUser?.sections[0]?.id ?? '';
  const {
    data: announcements,
    isPending,
    error,
  } = useSectionAnnouncementsQuery(sectionId);
  const { isRead } = useStudentNoticeReadState(userId, sectionId);
  const studentNoticeColumns = createStudentNoticeColumns(isRead);

  if (!sectionId) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <Text color='secondary'>소속 분반이 없어요.</Text>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <Text color='secondary'>공지사항을 불러오는 중...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <Text role='alert'>공지사항을 불러오지 못했어요.</Text>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Heading level={1}>공지사항</Heading>
      <Card className={styles.tableCard}>
        <Table<SectionAnnouncement>
          data={announcements ?? []}
          idKey='id'
          columns={studentNoticeColumns}
          emptyState={
            <span className={styles.emptyCell}>등록된 공지사항이 없어요.</span>
          }
          dividers='rows'
          density='balanced'
        />
      </Card>
    </div>
  );
}
