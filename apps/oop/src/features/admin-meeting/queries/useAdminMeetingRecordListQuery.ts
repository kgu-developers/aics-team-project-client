import {
  fetchAdminMeetingRecordList,
  type AdminMeetingRecordListFilter,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

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
  });
}
