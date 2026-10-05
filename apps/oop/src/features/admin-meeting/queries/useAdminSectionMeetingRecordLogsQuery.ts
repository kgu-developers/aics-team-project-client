import {
  fetchAdminSectionMeetingRecordLogs,
  type AdminSectionMeetingRecordEditLogsFilter,
} from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { adminMeetingKeys } from './adminMeetingKeys';

export function useAdminSectionMeetingRecordLogsQuery(
  accessibleSectionIds: readonly string[],
  sectionId: string | undefined,
  filter?: AdminSectionMeetingRecordEditLogsFilter,
) {
  const canRequest =
    sectionId !== undefined && accessibleSectionIds.includes(sectionId);

  return useQuery({
    queryKey: sectionId
      ? adminMeetingKeys.sectionEditLogs(
          accessibleSectionIds,
          sectionId,
          filter,
        )
      : adminMeetingKeys.all,
    enabled: canRequest,
    queryFn:
      canRequest && sectionId
        ? () => fetchAdminSectionMeetingRecordLogs(sectionId, filter)
        : skipToken,
    retry: false,
  });
}
