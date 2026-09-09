import type { StudentSubmissionVersionResponse } from '@aics/core';

import { apiClient } from '../client';
import {
  validateStudentSubmissionId,
  validateStudentSubmissionVersionNumber,
  validateStudentSubmissionVersion,
} from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchStudentSubmissionVersion(
  submissionId: string,
  version: number,
): Promise<StudentSubmissionVersionResponse> {
  validateStudentSubmissionId(submissionId);
  validateStudentSubmissionVersionNumber(version);
  const response = await apiClient.get<unknown>(
    ENDPOINTS.SUBMISSION.VERSION(submissionId, version),
  );
  validateStudentSubmissionVersion(response.data, version);
  return response.data;
}
