import { fetchAdminSubmissionVersions } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminSubmissionVersionsView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminSubmissionVersionsQuery(
  submissionId: string | undefined,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(submissionId) && enabled,
    retry: false,
    queryKey: adminMilestoneSubmissionsKeys.versions(submissionId ?? ''),
    queryFn: async () => {
      if (!submissionId) {
        throw new Error('제출물 ID가 필요합니다.');
      }

      return toAdminSubmissionVersionsView(
        await fetchAdminSubmissionVersions(submissionId),
      );
    },
  });
}
