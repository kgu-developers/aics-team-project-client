import type {
  AdminOopSectionContactVisibilityInput,
  AdminOopSectionDto,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateAdminOopSectionContactVisibility({
  input,
  sectionId,
}: {
  input: AdminOopSectionContactVisibilityInput;
  sectionId: string | number;
}): Promise<AdminOopSectionDto> {
  const response = await apiClient.patch<AdminOopSectionDto>(
    ENDPOINTS.ADMIN.OOP_SECTION_CONTACT_VISIBILITY(sectionId),
    input,
  );
  return response.data;
}
