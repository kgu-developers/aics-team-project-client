import type {
  AdminSectionEnrollmentDto,
  UpdateAdminSectionEnrollmentInput,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateAdminSectionEnrollment(
  sectionId: string | number,
  studentNumber: string,
  input: UpdateAdminSectionEnrollmentInput,
): Promise<AdminSectionEnrollmentDto> {
  const response = await apiClient.patch<AdminSectionEnrollmentDto>(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENT(sectionId, studentNumber),
    input,
  );

  return response.data;
}
