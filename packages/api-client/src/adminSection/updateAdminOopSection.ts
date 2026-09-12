import type { AdminOopSectionDto, AdminOopSectionUpdateInput } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateAdminOopSection({
  input,
  sectionId,
}: {
  input: AdminOopSectionUpdateInput;
  sectionId: string | number;
}): Promise<AdminOopSectionDto> {
  const response = await apiClient.patch<AdminOopSectionDto>(
    ENDPOINTS.ADMIN.OOP_SECTION(sectionId),
    input,
  );
  return response.data;
}
