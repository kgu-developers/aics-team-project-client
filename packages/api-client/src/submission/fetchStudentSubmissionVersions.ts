import type { StudentSubmissionVersionResponse } from '@aics/core';

import { apiClient } from '../client';
import {
  validateStudentSubmissionId,
  validateStudentSubmissionVersions,
} from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchStudentSubmissionVersions(
  submissionId: string,
): Promise<StudentSubmissionVersionResponse[]> {
  validateStudentSubmissionId(submissionId);
  const response = await apiClient.get<unknown>(
    ENDPOINTS.SUBMISSION.VERSIONS(submissionId),
  );
  validateStudentSubmissionVersions(response.data);
  return response.data.contents;
}
