import { fetchMeetingActionEntries } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { hasMeetingApiId, meetingApiKeys } from './meetingApiKeys';

export function useMeetingActionEntriesQuery(meetingId?: string) {
  return useQuery({
    queryKey: meetingApiKeys.recordActions(meetingId),
    queryFn: hasMeetingApiId(meetingId)
      ? () => fetchMeetingActionEntries(meetingId)
      : skipToken,
  });
}
