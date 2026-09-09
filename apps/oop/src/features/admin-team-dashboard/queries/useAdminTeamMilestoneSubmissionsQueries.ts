import { fetchAdminMilestoneSubmissions } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { toAdminMilestoneSubmissionsView } from '~/features/admin-milestone-review/model';
import { adminMilestoneSubmissionsKeys } from '~/features/admin-milestone-review/queries';

export function useAdminTeamMilestoneSubmissionsQueries(
  milestoneIds: string[],
  teamId: string | undefined,
) {
  return useQueries({
    queries: milestoneIds.map(milestoneId => ({
      enabled: Boolean(teamId),
      queryKey: adminMilestoneSubmissionsKeys.list(milestoneId, teamId),
      queryFn: async () =>
        toAdminMilestoneSubmissionsView(
          await fetchAdminMilestoneSubmissions(milestoneId, teamId),
        ),
    })),
  });
}
