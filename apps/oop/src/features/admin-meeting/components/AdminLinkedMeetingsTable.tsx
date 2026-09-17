import {
  Card,
  proportional,
  Table,
  type TableProps,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

type LinkedMeeting = {
  authorName?: string | null;
  id: number | string;
  meetingAt: string;
  participantCount: number;
  title: string;
};

type LinkedMeetingTablePlugin = NonNullable<
  TableProps<LinkedMeeting>['plugins']
>[string];

export function AdminLinkedMeetingsTable({
  authorLabel = '작성자',
  records,
}: {
  authorLabel?: string;
  records: LinkedMeeting[];
}) {
  const navigate = useNavigate();
  const rowInteractionPlugin = useMemo<LinkedMeetingTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, record) => {
        const openMeeting = () =>
          void navigate({
            params: { meetingId: String(record.id) },
            to: ROUTES.ADMIN_MEETING_DETAIL,
          });
        const onClick = rowRenderProps.htmlProps.onClick;
        const onKeyDown = rowRenderProps.htmlProps.onKeyDown;

        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'aria-label': `${record.title} 회의록 보기`,
            style: {
              ...rowRenderProps.htmlProps.style,
              cursor: 'pointer',
            },
            onClick: event => {
              onClick?.(event);
              if (event.defaultPrevented) return;
              openMeeting();
            },
            onKeyDown: event => {
              onKeyDown?.(event);
              if (event.defaultPrevented) return;
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              openMeeting();
            },
            tabIndex: 0,
          },
        };
      },
    }),
    [navigate],
  );

  return (
    <Card>
      <Table
        columns={[
          {
            align: 'start',
            header: '회의 제목',
            key: 'title',
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
            header: authorLabel,
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
        hasHover
        idKey='id'
        plugins={{ rowInteraction: rowInteractionPlugin }}
        verticalAlign='middle'
      />
    </Card>
  );
}
