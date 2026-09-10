import { fetchRequiredSubmissionArtifacts } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import {
  hasSubmissionScope,
  type StudentSubmissionScope,
} from '../submissionScope';
import { studentSubmissionKeys } from './studentSubmissionKeys';

export function useRequiredSubmissionArtifactsQuery(
  scope: StudentSubmissionScope,
) {
  return useQuery({
    queryKey: [...studentSubmissionKeys.scope(scope), 'required-artifacts'],
    queryFn: hasSubmissionScope(scope)
      ? () =>
          fetchRequiredSubmissionArtifacts(scope.sectionId!, scope.milestoneId!)
      : skipToken,
    retry: false,
    staleTime: 0,
  });
}
