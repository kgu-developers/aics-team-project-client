import { fetchTeamMeetingActions } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { meetingKeys } from './meetingKeys';

export function useTeamMeetingActionsQuery(teamId: string | null | undefined) {
  return useQuery({
    queryKey: teamId ? meetingKeys.actions(teamId) : meetingKeys.all,
    queryFn: teamId ? () => fetchTeamMeetingActions(teamId) : skipToken,
  });
}
