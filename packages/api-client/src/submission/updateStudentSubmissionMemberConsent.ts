import type { StudentSubmissionMemberConsent } from '@aics/core';

import { apiClient } from '../client';
import { validateStudentSubmissionConsent } from './studentSubmissionConsentContract';
import { validateStudentSubmissionId } from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

/** PUT confirms the server session's user for the current server version. */
export async function updateStudentSubmissionMemberConsent(
  submissionId: string,
): Promise<StudentSubmissionMemberConsent> {
  validateStudentSubmissionId(submissionId);
  const response = await apiClient.put<unknown>(
    ENDPOINTS.SUBMISSION.MY_MEMBER_CONFIRMATION(submissionId),
  );
  validateStudentSubmissionConsent(response.data);
  return response.data;
}
