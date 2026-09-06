import { fetchAdminSectionMilestone } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminSectionMilestoneKeys } from './adminSectionMilestoneKeys';

export function useAdminSectionMilestoneQuery(
  sectionId: string | undefined,
  milestoneId: string | undefined,
) {
  const isEnabled = Boolean(sectionId && milestoneId);

  return useQuery({
    enabled: isEnabled,
    queryKey:
      sectionId && milestoneId
        ? adminSectionMilestoneKeys.detail(sectionId, milestoneId)
        : ([...adminSectionMilestoneKeys.all, 'detail', 'disabled'] as const),
    queryFn: () => {
      if (!sectionId || !milestoneId) {
        throw new Error('분반 ID와 마일스톤 ID가 필요합니다.');
      }

      return fetchAdminSectionMilestone(sectionId, milestoneId);
    },
  });
}
