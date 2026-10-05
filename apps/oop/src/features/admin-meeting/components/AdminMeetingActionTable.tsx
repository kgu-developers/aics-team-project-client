import type { AdminSectionMeetingAction } from '@aics/api-client';
import type { MeetingActionStatus } from '@aics/core';
import {
  HStack,
  proportional,
  StatusDot,
  Table,
  Text,
  type StatusDotVariant,
  type TableColumn,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import { formatAdminMeetingDateTime } from '~/features/admin-meeting/model';

import * as styles from './AdminMeetingActionTable.css';

type AdminMeetingActionTableProps = {
  actions: readonly AdminSectionMeetingAction[];
  emptyMessage: string;
  showMeeting?: boolean;
  showTeam?: boolean;
};

const statusLabels: Record<MeetingActionStatus, string> = {
  TODO: '시작 전',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
};

const statusDotVariants: Record<MeetingActionStatus, StatusDotVariant> = {
  TODO: 'neutral',
  IN_PROGRESS: 'accent',
  DONE: 'success',
};

export default function AdminMeetingActionTable({
  actions,
  emptyMessage,
  showMeeting = true,
  showTeam = true,
}: AdminMeetingActionTableProps) {
  const columns = useMemo<TableColumn<AdminSectionMeetingAction>[]>(() => {
    const result: TableColumn<AdminSectionMeetingAction>[] = [];

    if (showTeam) {
      result.push({
        header: '팀',
        key: 'team',
        renderCell: action => <span>{action.teamName}</span>,
        width: proportional(1.1, { minWidth: 104 }),
      });
    }

    if (showMeeting) {
      result.push({
        header: '회의록',
        key: 'meeting',
        renderCell: action => (
          <div className={styles.cell}>
            <Link
              className={styles.meetingLink}
              params={{ meetingId: String(action.meetingRecordId) }}
              to={ROUTES.ADMIN_MEETING_DETAIL}
            >
              {action.meetingRecordTitle}
            </Link>
            <span className={styles.secondaryText}>
              {formatAdminMeetingDateTime(action.meetingAt)}
            </span>
          </div>
        ),
        width: proportional(1.8, { minWidth: 160 }),
      });
    }

    result.push(
      {
        header: '액션 항목',
        key: 'content',
        renderCell: action => (
          <div className={styles.cell}>
            <span className={styles.actionContent}>{action.content}</span>
            <span className={styles.secondaryText}>
              생성 {formatAdminMeetingDateTime(action.createdAt)}
            </span>
          </div>
        ),
        width: proportional(3, { minWidth: 220 }),
      },
      {
        header: '담당자',
        key: 'assignee',
        renderCell: action => <span>{action.assigneeName ?? '미지정'}</span>,
        width: proportional(1, { minWidth: 100 }),
      },
      {
        header: '상태',
        key: 'status',
        renderCell: action => (
          <HStack gap={1}>
            <StatusDot
              label={`${statusLabels[action.status]} 상태`}
              variant={statusDotVariants[action.status]}
            />
            <Text>{statusLabels[action.status]}</Text>
          </HStack>
        ),
        width: proportional(1, { minWidth: 100 }),
      },
      {
        header: '기한',
        key: 'dueAt',
        renderCell: action => (
          <span>
            {action.dueAt ? formatAdminMeetingDateTime(action.dueAt) : '없음'}
          </span>
        ),
        width: proportional(1.2, { minWidth: 128 }),
      },
    );

    return result;
  }, [showMeeting, showTeam]);

  return (
    <Table<AdminSectionMeetingAction>
      columns={columns}
      data={[...actions]}
      density='balanced'
      dividers='grid'
      emptyState={<span className={styles.emptyCell}>{emptyMessage}</span>}
      idKey='id'
      plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
      textOverflow='wrap'
      verticalAlign='top'
    />
  );
}
