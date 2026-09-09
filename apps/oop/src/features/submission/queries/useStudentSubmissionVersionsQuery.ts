import { fetchStudentSubmissionVersions } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { studentSubmissionKeys } from './studentSubmissionKeys';
import {
  hasSubmissionApiId,
  hasSubmissionScope,
  type StudentSubmissionScope,
} from '../submissionScope';

export function useStudentSubmissionVersionsQuery(
  scope: StudentSubmissionScope,
  submissionId?: string,
) {
  return useQuery({
    queryKey: studentSubmissionKeys.versions(scope, submissionId),
    queryFn:
      hasSubmissionScope(scope) && hasSubmissionApiId(submissionId)
        ? () => fetchStudentSubmissionVersions(submissionId)
        : skipToken,
    retry: false,
    staleTime: 0,
  });
}
