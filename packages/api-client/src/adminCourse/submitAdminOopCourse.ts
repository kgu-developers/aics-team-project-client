import type {
  AdminOopCourseInput,
  AdminOopCoursePersistResponse,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitAdminOopCourse(
  input: AdminOopCourseInput,
): Promise<AdminOopCoursePersistResponse> {
  const response = await apiClient.post<AdminOopCoursePersistResponse>(
    ENDPOINTS.ADMIN.OOP_COURSES,
    input,
  );

  return response.data;
}
