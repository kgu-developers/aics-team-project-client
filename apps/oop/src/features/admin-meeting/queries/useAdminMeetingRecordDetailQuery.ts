import { fetchAdminMeetingRecordDetail } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { adminMeetingKeys } from './adminMeetingKeys';

function isMeetingId(value: string | undefined) {
  return Boolean(value && /^\d+$/.test(value));
}

export function useAdminMeetingRecordDetailQuery(
  meetingId: string | undefined,
) {
  const canRequest = isMeetingId(meetingId);

  return useQuery({
    queryKey: meetingId
      ? adminMeetingKeys.serverDetail(meetingId)
      : adminMeetingKeys.all,
    queryFn:
      canRequest && meetingId
        ? () => fetchAdminMeetingRecordDetail(meetingId)
        : skipToken,
    retry: false,
  });
}
