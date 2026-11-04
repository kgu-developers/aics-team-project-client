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
  leaderLookupState?: 'error' | 'loading' | 'ready';
  leaderNamesByTeamId?: ReadonlyMap<number, string | null>;
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
  leaderLookupState = 'ready',
  leaderNamesByTeamId,
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
        width: proportional(0.7, { minWidth: 64 }),
      });
      result.push({
        header: '팀장',
        key: 'leader',
        renderCell: action => {
          const leaderName = leaderNamesByTeamId?.get(action.teamId);
          const label =
            leaderLookupState === 'error'
              ? '불러오기 실패'
              : leaderName !== undefined
                ? (leaderName ?? '-')
                : leaderLookupState === 'loading'
                  ? '불러오는 중'
                  : '-';

          return <span title={label}>{label}</span>;
        },
        width: proportional(0.8, { minWidth: 80 }),
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
              title={action.meetingRecordTitle}
              to={ROUTES.ADMIN_MEETING_DETAIL}
            >
              {action.meetingRecordTitle}
            </Link>
            <span
              className={styles.secondaryText}
              title={formatAdminMeetingDateTime(action.meetingAt)}
            >
              {formatAdminMeetingDateTime(action.meetingAt)}
            </span>
          </div>
        ),
        width: proportional(1.3, { minWidth: 128 }),
      });
    }

    result.push(
      {
        header: '액션 항목',
        key: 'content',
        renderCell: action => (
          <div className={styles.cell}>
            <span className={styles.actionContent} title={action.content}>
              {action.content}
            </span>
            <span
              className={styles.secondaryText}
              title={`생성 ${formatAdminMeetingDateTime(action.createdAt)}`}
            >
              생성 {formatAdminMeetingDateTime(action.createdAt)}
            </span>
          </div>
        ),
        width: proportional(2.3, { minWidth: 160 }),
      },
      {
        header: '담당자',
        key: 'assignee',
        renderCell: action => (
          <span title={action.assigneeName ?? '미지정'}>
            {action.assigneeName ?? '미지정'}
          </span>
        ),
        width: proportional(0.8, { minWidth: 80 }),
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
        width: proportional(0.85, { minWidth: 88 }),
      },
      {
        header: '기한',
        key: 'dueAt',
        renderCell: action => (
          <span
            title={
              action.dueAt ? formatAdminMeetingDateTime(action.dueAt) : '없음'
            }
          >
            {action.dueAt ? formatAdminMeetingDateTime(action.dueAt) : '없음'}
          </span>
        ),
        width: proportional(1, { minWidth: 112 }),
      },
    );

    return result;
  }, [leaderLookupState, leaderNamesByTeamId, showMeeting, showTeam]);

  return (
    <Table<AdminSectionMeetingAction>
      columns={columns}
      data={[...actions]}
      density='balanced'
      dividers='grid'
      emptyState={<span className={styles.emptyCell}>{emptyMessage}</span>}
      idKey='id'
      plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
      textOverflow='truncate'
      verticalAlign='top'
    />
  );
}
