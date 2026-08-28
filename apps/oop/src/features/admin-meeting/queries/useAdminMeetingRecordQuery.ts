import { fetchAdminMeetingRecord } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { adminMeetingKeys } from './adminMeetingKeys';

export function useAdminMeetingRecordQuery(
  meetingId: string | undefined,
  sectionId: string | undefined,
  isAccessibleSection: boolean,
) {
  const canRequest = Boolean(meetingId && sectionId && isAccessibleSection);

  return useQuery({
    queryKey:
      meetingId && sectionId
        ? adminMeetingKeys.detail(meetingId, sectionId)
        : adminMeetingKeys.all,
    queryFn:
      canRequest && meetingId && sectionId
        ? () => fetchAdminMeetingRecord(meetingId, sectionId)
        : skipToken,
    retry: false,
  });
}
