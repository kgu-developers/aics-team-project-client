import type { AdminOopCourseDto } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminOopCourse(
  courseId: string | number,
): Promise<AdminOopCourseDto> {
  const response = await apiClient.get<AdminOopCourseDto>(
    ENDPOINTS.ADMIN.OOP_COURSE(courseId),
  );

  return response.data;
}
