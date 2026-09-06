import { fetchMeetingRecordDetail } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { hasMeetingApiId, meetingApiKeys } from './meetingApiKeys';

export function useMeetingRecordDetailQuery(meetingId?: string) {
  return useQuery({
    queryKey: meetingApiKeys.detail(meetingId),
    queryFn: hasMeetingApiId(meetingId)
      ? () => fetchMeetingRecordDetail(meetingId)
      : skipToken,
  });
}
