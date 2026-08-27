import { fetchMeetingRecords } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useMeetingRecordsQuery(teamId: string | null | undefined) {
  return useQuery({
    queryKey: teamId ? meetingKeys.list(teamId) : meetingKeys.all,
    queryFn: teamId ? () => fetchMeetingRecords(teamId) : skipToken,
  });
}
