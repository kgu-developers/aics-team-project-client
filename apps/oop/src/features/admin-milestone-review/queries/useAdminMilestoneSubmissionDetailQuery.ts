import { fetchAdminMilestoneSubmissionDetail } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminMilestoneSubmissionDetailView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminMilestoneSubmissionDetailQuery(
  submissionId: string | undefined,
  enabled = true,
) {
  return useQuery({
    enabled: Boolean(submissionId) && enabled,
    queryKey: adminMilestoneSubmissionsKeys.detail(submissionId ?? ''),
    queryFn: async () => {
      if (!submissionId) {
        throw new Error('제출물 ID가 필요합니다.');
      }

      return toAdminMilestoneSubmissionDetailView(
        await fetchAdminMilestoneSubmissionDetail(submissionId),
      );
    },
  });
}
