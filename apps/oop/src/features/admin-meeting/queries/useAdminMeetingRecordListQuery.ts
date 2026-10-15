import {
  fetchAdminMeetingRecordList,
  type AdminMeetingRecordListFilter,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { compareDateTimeDesc } from '~/shared/lib/compareDateTimeDesc';

import { adminMeetingKeys } from './adminMeetingKeys';

export function useAdminMeetingRecordListQuery(
  accessibleSectionIds: readonly string[],
  filter?: AdminMeetingRecordListFilter,
  isEnabled = true,
) {
  return useQuery({
    enabled: accessibleSectionIds.length > 0 && isEnabled,
    queryKey: adminMeetingKeys.serverList(accessibleSectionIds, filter),
    queryFn: () => fetchAdminMeetingRecordList(filter),
    select: response => ({
      ...response,
      contents: [...response.contents].sort(
        (left, right) =>
          compareDateTimeDesc(left.meetingAt, right.meetingAt) ||
          right.id - left.id,
      ),
    }),
  });
}
