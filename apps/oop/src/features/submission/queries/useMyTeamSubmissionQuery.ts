import { fetchMyTeamSubmission } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { submissionKeys } from './submissionKeys';

export function useMyTeamSubmissionQuery(
  sectionId: string,
  userId: string,
  milestoneId: string,
) {
  return useQuery({
    enabled: Boolean(sectionId && userId && milestoneId),
    queryKey: submissionKeys.byMilestone(sectionId, userId, milestoneId),
    queryFn: () => fetchMyTeamSubmission(milestoneId),
  });
}
