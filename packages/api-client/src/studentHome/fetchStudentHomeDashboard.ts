import type { StudentHomeDashboard } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchStudentHomeDashboard(
  sectionId: string,
): Promise<StudentHomeDashboard> {
  const response = await apiClient.get<StudentHomeDashboard>(
    ENDPOINTS.SECTION.STUDENT_DASHBOARD(sectionId),
  );

  return response.data;
}
