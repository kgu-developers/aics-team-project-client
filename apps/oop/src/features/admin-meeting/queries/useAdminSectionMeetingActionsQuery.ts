import {
  fetchAdminSectionMeetingActions,
  type AdminSectionMeetingActionsFilter,
} from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { adminMeetingKeys } from './adminMeetingKeys';

export function useAdminSectionMeetingActionsQuery(
  accessibleSectionIds: readonly string[],
  sectionId: string | undefined,
  filter?: AdminSectionMeetingActionsFilter,
) {
  const canRequest =
    sectionId !== undefined && accessibleSectionIds.includes(sectionId);

  return useQuery({
    queryKey: sectionId
      ? adminMeetingKeys.sectionActions(accessibleSectionIds, sectionId, filter)
      : adminMeetingKeys.all,
    enabled: canRequest,
    queryFn:
      canRequest && sectionId
        ? () => fetchAdminSectionMeetingActions(sectionId, filter)
        : skipToken,
    retry: false,
  });
}
