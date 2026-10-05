import type { AdminSectionMeetingRecordEditLog } from '@aics/api-client';
import { proportional, Table, type TableColumn } from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import { formatAdminMeetingDateTime } from '~/features/admin-meeting/model';

import * as styles from './AdminMeetingEditLogTable.css';

type AdminMeetingEditLogTableProps = {
  emptyMessage: string;
  logs: readonly AdminSectionMeetingRecordEditLog[];
  showMeeting?: boolean;
  showTeam?: boolean;
};

export default function AdminMeetingEditLogTable({
  emptyMessage,
  logs,
  showMeeting = true,
  showTeam = true,
}: AdminMeetingEditLogTableProps) {
  const columns = useMemo<
    TableColumn<AdminSectionMeetingRecordEditLog>[]
  >(() => {
    const result: TableColumn<AdminSectionMeetingRecordEditLog>[] = [];

    if (showTeam) {
      result.push({
        header: '팀',
        key: 'team',
        renderCell: log => <span>{log.teamName ?? '-'}</span>,
        width: proportional(1, { minWidth: 100 }),
      });
    }

    if (showMeeting) {
      result.push({
        header: '회의록',
        key: 'meeting',
        renderCell: log => (
          <Link
            className={styles.meetingLink}
            params={{ meetingId: String(log.meetingRecordId) }}
            to={ROUTES.ADMIN_MEETING_DETAIL}
          >
            {log.meetingRecordTitle ?? '삭제된 회의록'}
          </Link>
        ),
        width: proportional(1.7, { minWidth: 160 }),
      });
    }

    result.push(
      {
        header: '수정자',
        key: 'editor',
        renderCell: log => (
          <div className={styles.cell}>
            <span>{log.editorName ?? log.editorId}</span>
            {log.editorName ? (
              <span className={styles.secondaryText}>{log.editorId}</span>
            ) : null}
          </div>
        ),
        width: proportional(1, { minWidth: 110 }),
      },
      {
        header: '수정 사유',
        key: 'reason',
        renderCell: log => <span className={styles.reason}>{log.reason}</span>,
        width: proportional(3, { minWidth: 240 }),
      },
      {
        header: '수정 시각',
        key: 'createdAt',
        renderCell: log => (
          <span>{formatAdminMeetingDateTime(log.createdAt)}</span>
        ),
        width: proportional(1.2, { minWidth: 144 }),
      },
    );

    return result;
  }, [showMeeting, showTeam]);

  return (
    <Table<AdminSectionMeetingRecordEditLog>
      columns={columns}
      data={[...logs]}
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
