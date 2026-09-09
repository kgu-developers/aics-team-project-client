import { fetchStudentSubmissionVersion } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import { studentSubmissionKeys } from './studentSubmissionKeys';
import {
  hasSubmissionApiId,
  hasSubmissionScope,
  type StudentSubmissionScope,
} from '../submissionScope';

export function useStudentSubmissionVersionQuery(
  scope: StudentSubmissionScope,
  submissionId?: string,
  version?: number,
) {
  return useQuery({
    queryKey: studentSubmissionKeys.version(scope, submissionId, version),
    queryFn:
      hasSubmissionScope(scope) &&
      hasSubmissionApiId(submissionId) &&
      version !== undefined &&
      Number.isSafeInteger(version) &&
      version > 0
        ? () => fetchStudentSubmissionVersion(submissionId, version)
        : skipToken,
    retry: false,
    staleTime: 0,
  });
}
