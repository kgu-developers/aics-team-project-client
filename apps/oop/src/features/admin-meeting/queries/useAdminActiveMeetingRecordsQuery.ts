import { fetchAdminMeetingRecordList } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { compareDateTimeDesc } from '~/shared/lib/compareDateTimeDesc';

import { adminMeetingKeys } from './adminMeetingKeys';

const DASHBOARD_ITEM_COUNT = 3;

export function useAdminActiveMeetingRecordsQuery(
  activeSectionIds: readonly string[],
) {
  const sectionIds = [...new Set(activeSectionIds)];
  const queries = useQueries({
    queries: sectionIds.map(sectionId => ({
      queryKey: adminMeetingKeys.serverList(sectionIds, {
        page: 0,
        sectionId,
        size: DASHBOARD_ITEM_COUNT,
      }),
      queryFn: () =>
        fetchAdminMeetingRecordList({
          page: 0,
          sectionId,
          size: DASHBOARD_ITEM_COUNT,
        }),
    })),
  });

  return {
    data: {
      contents: queries
        .flatMap(query => query.data?.contents ?? [])
        .sort(
          (left, right) =>
            compareDateTimeDesc(left.meetingAt, right.meetingAt) ||
            right.id - left.id,
        ),
    },
    isError: queries.some(query => query.isError),
    isPending: queries.some(query => query.isPending),
  };
}
