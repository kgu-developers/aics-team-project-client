import {
  fetchAdminMeetingRecords,
  type AdminMeetingRecordsFilter,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMeetingKeys } from './adminMeetingKeys';

export function useAdminMeetingRecordsQuery(
  accessibleSectionIds: readonly string[],
  filter?: AdminMeetingRecordsFilter,
  isEnabled = true,
) {
  return useQuery({
    enabled: accessibleSectionIds.length > 0 && isEnabled,
    queryKey: adminMeetingKeys.list(accessibleSectionIds, filter),
    queryFn: () => fetchAdminMeetingRecords(filter),
    select: response => ({
      ...response,
      records: [...response.records].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    }),
  });
}
