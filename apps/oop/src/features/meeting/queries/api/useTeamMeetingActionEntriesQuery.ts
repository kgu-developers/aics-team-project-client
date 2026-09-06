import { fetchTeamMeetingActionEntries } from '@aics/api-client';
import type { MeetingApiActionStatus } from '@aics/core';
import { skipToken, useQuery } from '@tanstack/react-query';

import { hasMeetingApiId, meetingApiKeys } from './meetingApiKeys';

export function useTeamMeetingActionEntriesQuery(
  teamId?: string,
  status?: MeetingApiActionStatus,
) {
  return useQuery({
    queryKey: meetingApiKeys.filteredTeamActions(teamId, status),
    queryFn: hasMeetingApiId(teamId)
      ? () => fetchTeamMeetingActionEntries(teamId, status)
      : skipToken,
  });
}
