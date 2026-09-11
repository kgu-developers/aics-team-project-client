import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeAdminOopCourse(
  courseId: string | number,
): Promise<void> {
  await apiClient.delete(ENDPOINTS.ADMIN.OOP_COURSE(courseId));
}
