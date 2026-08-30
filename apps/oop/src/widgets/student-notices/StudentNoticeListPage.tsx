import type { SectionAnnouncement } from '@aics/core';
import {
  Badge,
  Card,
  Heading,
  Table,
  Text,
  type TableProps,
  proportional,
} from '@aics/design-system';
import type { TableColumn } from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import { useSectionAnnouncementsQuery } from '~/features/student-notices/queries';
import { useStudentNoticeReadState } from '~/features/student-notices/useStudentNoticeReadState';

import * as styles from './StudentNoticePages.css';

function createStudentNoticeColumns(
  isRead: (noticeId: string) => boolean,
): TableColumn<SectionAnnouncement>[] {
  const columns: TableColumn<SectionAnnouncement>[] = [
    {
      key: 'createdAt',
      header: '날짜',
      width: proportional(1, { minWidth: 80 }),
      renderCell: item => <>{item.createdAt.slice(0, 10)}</>,
    },
    {
      key: 'title',
      header: '제목',
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
      width: proportional(2, { minWidth: 128 }),
    },
  ];
  columns.push({
    key: 'authorName',
    header: '작성자',
    width: proportional(1),
  });
  return columns;
}

type NoticeTablePlugin = NonNullable<
  TableProps<SectionAnnouncement>['plugins']
>[string];

export default function StudentNoticeListPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const userId = currentUser?.id ?? '';
  const sectionId = currentUser?.sections[0]?.id ?? '';
  const {
    data: announcements,
    isPending,
    error,
  } = useSectionAnnouncementsQuery(sectionId);
  const { isRead } = useStudentNoticeReadState(userId, sectionId);
  const noticeColumns = useMemo(
    () => createStudentNoticeColumns(isRead),
    [isRead],
  );
  const rowInteractionPlugin = useMemo<NoticeTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, item) => {
        const openNotice = () =>
          void navigate({
            to: '/student/notices/$noticeId',
            params: { noticeId: item.id },
          });
        const onClick = rowRenderProps.htmlProps.onClick;
        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'data-student-notice-row': '',
            onClick: event => {
              onClick?.(event);
              if (event.defaultPrevented) return;
              if (
                event.target instanceof Element &&
                event.target.closest('a, button, input, select, textarea')
              )
                return;
              openNotice();
            },
          },
        };
      },
    }),
    [navigate],
  );

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
        <div className={styles.responsiveTable}>
          <Table<SectionAnnouncement>
            columns={noticeColumns}
            data={announcements ?? []}
            emptyState={
              <span className={styles.emptyCell}>
                등록된 공지사항이 없어요.
              </span>
            }
            idKey='id'
            plugins={{ rowInteraction: rowInteractionPlugin }}
            dividers='rows'
            density='balanced'
            hasHover
          />
        </div>
      </Card>
    </div>
  );
}
