import { fetchAdminMilestoneSchedule } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminMilestoneScheduleView } from '../model';
import { adminMilestoneScheduleKeys } from './adminMilestoneScheduleKeys';

export function useAdminMilestoneScheduleQuery(
  accessibleSectionIds: readonly string[],
) {
  return useQuery({
    enabled: accessibleSectionIds.length > 0,
    queryKey: adminMilestoneScheduleKeys.list(accessibleSectionIds),
    queryFn: async () =>
      toAdminMilestoneScheduleView(
        await fetchAdminMilestoneSchedule(),
        accessibleSectionIds,
      ),
  });
}
