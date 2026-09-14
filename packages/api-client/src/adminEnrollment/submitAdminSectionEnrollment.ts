import type { AdminSectionEnrollmentDto } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type SubmitAdminSectionEnrollmentInput = {
  studentNumber: string;
  role: 'ASSISTANT' | 'STUDENT';
};

export async function submitAdminSectionEnrollment(
  sectionId: string | number,
  input: SubmitAdminSectionEnrollmentInput,
): Promise<AdminSectionEnrollmentDto> {
  const response = await apiClient.post<AdminSectionEnrollmentDto>(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(sectionId),
    input,
  );

  return response.data;
}
