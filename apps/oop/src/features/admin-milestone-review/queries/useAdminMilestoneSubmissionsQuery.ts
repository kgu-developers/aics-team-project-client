import { fetchAdminMilestoneSubmissions } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminMilestoneSubmissionsView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminMilestoneSubmissionsQuery(
  milestoneId: string | undefined,
  isEnabled: boolean,
) {
  return useQuery({
    enabled: Boolean(milestoneId) && isEnabled,
    queryKey: adminMilestoneSubmissionsKeys.list(milestoneId ?? 'disabled'),
    queryFn: async () => {
      if (!milestoneId) {
        throw new Error('마일스톤 ID가 필요합니다.');
      }

      return toAdminMilestoneSubmissionsView(
        await fetchAdminMilestoneSubmissions(milestoneId),
      );
    },
  });
}
