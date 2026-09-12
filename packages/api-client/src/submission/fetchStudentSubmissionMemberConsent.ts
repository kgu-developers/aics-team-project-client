import type { StudentSubmissionMemberConsent } from '@aics/core';

import { apiClient } from '../client';
import { validateStudentSubmissionConsent } from './studentSubmissionConsentContract';
import { validateStudentSubmissionId } from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchStudentSubmissionMemberConsent(
  submissionId: string,
  signal?: AbortSignal,
): Promise<StudentSubmissionMemberConsent> {
  validateStudentSubmissionId(submissionId);
  const response = await apiClient.get<unknown>(
    ENDPOINTS.SUBMISSION.MEMBER_CONFIRMATIONS(submissionId),
    { signal },
  );
  validateStudentSubmissionConsent(response.data);
  return response.data;
}
