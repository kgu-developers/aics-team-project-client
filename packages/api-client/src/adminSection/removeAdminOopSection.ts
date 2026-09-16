import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeAdminOopSection(sectionId: number): Promise<void> {
  await apiClient.delete(ENDPOINTS.ADMIN.OOP_SECTION(sectionId));
}
