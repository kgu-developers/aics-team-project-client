import { fetchMeetingRecordSummaries } from '@aics/api-client';
import type { MeetingPhase } from '@aics/core';
import { skipToken, useQuery } from '@tanstack/react-query';

import { hasMeetingApiId, meetingApiKeys } from './meetingApiKeys';

export function useMeetingRecordSummariesQuery(
  teamId?: string,
  phase?: MeetingPhase,
) {
  return useQuery({
    queryKey: meetingApiKeys.filteredList(teamId, phase),
    queryFn: hasMeetingApiId(teamId)
      ? () => fetchMeetingRecordSummaries(teamId, phase)
      : skipToken,
  });
}
