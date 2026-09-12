import type { StudentSubmissionResponse } from '@aics/core';

import { apiClient } from '../client';
import {
  validateStudentSubmission,
  validateStudentSubmissionId,
} from './studentSubmissionContract';

export async function updateStudentSubmissionCompletion(
  submissionId: string,
): Promise<StudentSubmissionResponse> {
  validateStudentSubmissionId(submissionId);
  const { data } = await apiClient.patch<unknown>(
    `/submissions/${submissionId}/complete`,
  );
  validateStudentSubmission(data);
  if (String(data.id) !== submissionId)
    throw new Error('요청한 제출 자료와 응답이 다릅니다.');
  return data;
}
