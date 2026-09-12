import { fetchAdminSubmission } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminSubmissionDetailView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminMilestoneSubmissionDetailQuery(
  submissionId: string | undefined,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(submissionId) && enabled,
    retry: false,
    queryKey: adminMilestoneSubmissionsKeys.detail(submissionId ?? ''),
    queryFn: async () => {
      if (!submissionId) {
        throw new Error('제출물 ID가 필요합니다.');
      }

      return toAdminSubmissionDetailView(
        await fetchAdminSubmission(submissionId),
      );
    },
  });
}
