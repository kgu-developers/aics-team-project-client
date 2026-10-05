import { fetchMeetingRecordChangeLogs } from '@aics/api-client';
import { useInfiniteQuery } from '@tanstack/react-query';

import { meetingApiKeys } from './api/meetingApiKeys';

export function useMeetingChangeLogsQuery(meetingId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: meetingApiKeys.changeLogs(meetingId),
    queryFn: ({ pageParam }) =>
      fetchMeetingRecordChangeLogs(meetingId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.pageable.isEnd ? undefined : pages.length,
    enabled: enabled && Boolean(meetingId),
    retry: false,
  });
}
