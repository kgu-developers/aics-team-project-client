import { Card, proportional, Table } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

type LinkedMeeting = {
  authorName?: string | null;
  id: number | string;
  meetingAt: string;
  participantCount: number;
  title: string;
};

export function AdminLinkedMeetingsTable({
  records,
}: {
  records: LinkedMeeting[];
}) {
  return (
    <Card>
      <Table
        columns={[
          {
            align: 'start',
            header: '회의 제목',
            key: 'title',
            renderCell: record => (
              <Link
                params={{ meetingId: String(record.id) }}
                to={ROUTES.ADMIN_MEETING_DETAIL}
              >
                {record.title}
              </Link>
            ),
            width: proportional(1.6, { minWidth: 200 }),
          },
          {
            align: 'center',
            header: '회의 일시',
            key: 'meetingAt',
            renderCell: record => formatSeoulDateTime(record.meetingAt),
            width: proportional(1.4, { minWidth: 170 }),
          },
          {
            align: 'center',
            header: '작성자',
            key: 'authorName',
            renderCell: record => record.authorName ?? '-',
            width: proportional(1, { minWidth: 120 }),
          },
          {
            align: 'center',
            header: '참석 인원',
            key: 'participantCount',
            renderCell: record => `${record.participantCount}명`,
            width: proportional(0.8, { minWidth: 100 }),
          },
        ]}
        data={records}
        dividers='rows'
        verticalAlign='middle'
      />
    </Card>
  );
}
