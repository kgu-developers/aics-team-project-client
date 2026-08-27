import { fetchAdminMeetingRecords } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMeetingKeys } from './adminMeetingKeys';

export function useAdminMeetingRecordsQuery(
  accessibleSectionIds: readonly string[],
) {
  return useQuery({
    enabled: accessibleSectionIds.length > 0,
    queryKey: adminMeetingKeys.list(accessibleSectionIds),
    queryFn: fetchAdminMeetingRecords,
    select: response => ({
      ...response,
      records: [...response.records].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    }),
  });
}
