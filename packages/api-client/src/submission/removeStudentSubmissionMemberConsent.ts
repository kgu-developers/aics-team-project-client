import type { StudentSubmissionMemberConsent } from '@aics/core';

import { apiClient } from '../client';
import { validateStudentSubmissionConsent } from './studentSubmissionConsentContract';
import { validateStudentSubmissionId } from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

/** DELETE returns the updated summary (200), not an empty 204 response. */
export async function removeStudentSubmissionMemberConsent(
  submissionId: string,
): Promise<StudentSubmissionMemberConsent> {
  validateStudentSubmissionId(submissionId);
  const response = await apiClient.delete<unknown>(
    ENDPOINTS.SUBMISSION.MY_MEMBER_CONFIRMATION(submissionId),
  );
  validateStudentSubmissionConsent(response.data);
  return response.data;
}
