import { fetchAdminSectionMilestoneSubmissions } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminMilestoneSubmissionsView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminMilestoneSubmissionsQuery(
  sectionId: string | undefined,
  milestoneId: string,
  isAccessibleSection: boolean,
) {
  return useQuery({
    enabled: Boolean(sectionId) && isAccessibleSection,
    queryKey: adminMilestoneSubmissionsKeys.list(sectionId ?? '', milestoneId),
    queryFn: async () => {
      if (!sectionId) {
        throw new Error('분반 ID가 필요합니다.');
      }

      return toAdminMilestoneSubmissionsView(
        await fetchAdminSectionMilestoneSubmissions(sectionId, milestoneId),
      );
    },
  });
}
