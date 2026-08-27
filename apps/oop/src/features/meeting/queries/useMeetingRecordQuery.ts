import { fetchMeetingRecord } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useMeetingRecordQuery(meetingId: string | null | undefined) {
  return useQuery({
    queryKey: meetingId ? meetingKeys.detail(meetingId) : meetingKeys.all,
    queryFn: meetingId ? () => fetchMeetingRecord(meetingId) : skipToken,
  });
}
