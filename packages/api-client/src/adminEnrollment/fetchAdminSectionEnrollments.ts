import type { AdminSectionEnrollmentsResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminSectionEnrollments(
  sectionId: string | number,
): Promise<AdminSectionEnrollmentsResponse> {
  const response = await apiClient.get<AdminSectionEnrollmentsResponse>(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(sectionId),
  );

  return response.data;
}
