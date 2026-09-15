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

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import SectionSelection from '~/features/section/SectionSelection';
import StudentContextState from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';
import { useSectionAnnouncementsQuery } from '~/features/student-notices/queries';
import { useStudentNoticeReadState } from '~/features/student-notices/useStudentNoticeReadState';

import * as styles from './StudentNoticePages.css';

function createStudentNoticeColumns(
  isRead: (noticeId: string) => boolean,
): TableColumn<SectionAnnouncement>[] {
  return [
    {
      key: 'publishedAt',
      header: '날짜',
      width: proportional(1, { minWidth: 80 }),
      renderCell: item => <>{item.publishedAt.slice(0, 10)}</>,
    },
    {
      key: 'title',
      header: '제목',
      renderCell: item => (
        <div className={styles.titleCell}>
          <Link
            className={styles.titleLink}
            params={{ noticeId: String(item.id) }}
            to='/student/notices/$noticeId'
          >
            {item.title}
          </Link>
          {!isRead(String(item.id)) ? (
            <Badge label='새 글' variant='info' />
          ) : null}
        </div>
      ),
      width: proportional(2, { minWidth: 128 }),
    },
  ];
}

type NoticeTablePlugin = NonNullable<
  TableProps<SectionAnnouncement>['plugins']
>[string];

export default function StudentNoticeListPage() {
  const navigate = useNavigate();
  const context = useStudentContext();
  const { sections, section, selectSection } = context;
  const userId = context.user?.id ?? '';
  const {
    data: announcements,
    isPending: isAnnouncementsPending,
    error: announcementsError,
  } = useSectionAnnouncementsQuery(section?.id);
  const { isRead } = useStudentNoticeReadState(
    userId,
    section ? String(section.id) : '',
  );
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
            params: { noticeId: String(item.id) },
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

  if (!section) return <StudentContextState context={context} sectionOnly />;
  if (isAnnouncementsPending) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <SectionSelection
          sections={sections}
          selectedId={section?.id}
          onSelect={selectSection}
        />
        <Text color='secondary'>공지사항을 불러오는 중...</Text>
      </div>
    );
  }

  if (announcementsError) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <SectionSelection
          sections={sections}
          selectedId={section?.id}
          onSelect={selectSection}
        />
        <Text role='alert'>공지사항을 불러오지 못했어요.</Text>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Heading level={1}>공지사항</Heading>
      <SectionSelection
        sections={sections}
        selectedId={section?.id}
        onSelect={selectSection}
      />
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
            plugins={{
              rowInteraction: rowInteractionPlugin,
              scrollWrapperLayout: tableScrollWrapperPlugin,
            }}
            dividers='rows'
            density='balanced'
            hasHover
          />
        </div>
      </Card>
    </div>
  );
}
