import { fetchAdminSectionMilestones } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export function useAdminSectionMilestonesQuery(sectionId: string | undefined) {
  return useQuery({
    enabled: Boolean(sectionId),
    queryKey: sectionId
      ? adminSectionMilestoneKeys.list(sectionId)
      : ([...adminSectionMilestoneKeys.all, 'list', 'disabled'] as const),
    queryFn: () => {
      if (!sectionId) {
        throw new Error('분반 ID가 필요합니다.');
      }

      return fetchAdminSectionMilestones(sectionId);
    },
  });
}
