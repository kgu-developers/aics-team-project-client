import type { AdminSectionEnrollmentCreatedResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type SubmitAdminSectionEnrollmentInput = {
  studentNumber: string;
  role: 'ASSISTANT' | 'STUDENT';
};

export async function submitAdminSectionEnrollment(
  sectionId: string | number,
  input: SubmitAdminSectionEnrollmentInput,
): Promise<AdminSectionEnrollmentCreatedResponse> {
  const response = await apiClient.post<AdminSectionEnrollmentCreatedResponse>(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(sectionId),
    input,
  );

  return response.data;
}
