import type { AdminOopCourseDto } from '../adminSection/types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminOopCoursesResponse = {
  contents: AdminOopCourseDto[];
};

export async function fetchAdminOopCourses(): Promise<AdminOopCoursesResponse> {
  const response = await apiClient.get<AdminOopCoursesResponse>(
    ENDPOINTS.ADMIN.OOP_COURSES,
  );

  return response.data;
}
