import type { StudentSubmissionResponse } from '@aics/core';

import { apiClient } from '../client';
import {
  validateStudentSubmissionId,
  validateStudentSubmission,
} from './studentSubmissionContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchStudentSubmission(
  submissionId: string,
): Promise<StudentSubmissionResponse> {
  validateStudentSubmissionId(submissionId);
  const response = await apiClient.get<unknown>(
    ENDPOINTS.SUBMISSION.DETAIL(submissionId),
  );
  validateStudentSubmission(response.data);
  if (String(response.data.id) !== submissionId)
    throw new Error('요청한 제출 자료와 응답이 다릅니다.');
  return response.data;
}
