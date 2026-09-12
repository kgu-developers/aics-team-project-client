import { fetchAdminSubmissionVersion } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminSubmissionVersionDetailView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminSubmissionVersionQuery(
  submissionId: string | undefined,
  version: number | undefined,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(submissionId) && version !== undefined && enabled,
    retry: false,
    queryKey: adminMilestoneSubmissionsKeys.version(
      submissionId ?? '',
      version,
    ),
    queryFn: async () => {
      if (!submissionId || version === undefined) {
        throw new Error('제출물 ID와 버전이 필요합니다.');
      }

      return toAdminSubmissionVersionDetailView(
        await fetchAdminSubmissionVersion(submissionId, version),
      );
    },
  });
}
