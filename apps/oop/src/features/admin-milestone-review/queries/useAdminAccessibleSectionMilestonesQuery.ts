import { fetchAdminSectionMilestones } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export function useAdminAccessibleSectionMilestonesQuery(
  sectionIds: readonly string[],
) {
  return useQueries({
    queries: sectionIds.map(sectionId => ({
      queryKey: adminSectionMilestoneKeys.list(sectionId),
      queryFn: () => fetchAdminSectionMilestones(sectionId),
    })),
  });
}
