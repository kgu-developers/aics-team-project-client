import { fetchSubmission } from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { submissionKeys } from './submissionKeys';

export function useSubmissionQuery(
  sectionId: string,
  userId: string,
  submissionId: string,
) {
  return useQuery({
    enabled: Boolean(sectionId && userId && submissionId),
    queryKey: submissionKeys.detail(sectionId, userId, submissionId),
    queryFn: () => fetchSubmission(submissionId),
  });
}
