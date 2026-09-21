import { fetchMeetingRecords } from '@aics/api-client';
import type { MeetingAction, MeetingRecord } from '@aics/core';
import { skipToken, useQuery } from '@tanstack/react-query';

import { seoulInstant } from '~/shared/lib/seoulInstant';

import { meetingKeys } from './meetingKeys';

const HOME_LIST_LIMIT = 3;

export type MeetingHomeSummary = {
  assignedActions: MeetingAction[];
  recentMeetingRecords: MeetingRecord[];
};

function selectMeetingHomeSummary(
  records: MeetingRecord[],
  currentUserId: string | null | undefined,
): MeetingHomeSummary {
  const recordsByRecentMeeting = [...records].sort(
    (left, right) => seoulInstant(right.heldAt) - seoulInstant(left.heldAt),
  );

  return {
    recentMeetingRecords: recordsByRecentMeeting.slice(0, HOME_LIST_LIMIT),
    assignedActions: currentUserId
      ? recordsByRecentMeeting
          .flatMap(record => record.actions)
          .filter(
            action =>
              action.assignee?.userId === currentUserId &&
              action.status !== 'DONE',
          )
          .slice(0, HOME_LIST_LIMIT)
      : [],
  };
}

export function useMeetingHomeSummaryQuery(
  teamId: string | null | undefined,
  currentUserId: string | null | undefined,
) {
  return useQuery({
    queryKey: teamId ? meetingKeys.list(teamId) : meetingKeys.all,
    queryFn: teamId ? () => fetchMeetingRecords(teamId) : skipToken,
    select: records => selectMeetingHomeSummary(records, currentUserId),
  });
}
