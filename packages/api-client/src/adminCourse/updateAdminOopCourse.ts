import type { AdminOopCourseInput } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateAdminOopCourse({
  courseId,
  input,
}: {
  courseId: string | number;
  input: AdminOopCourseInput;
}): Promise<void> {
  await apiClient.put(ENDPOINTS.ADMIN.OOP_COURSE(courseId), input);
}
