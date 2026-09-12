import type {
  AdminOopSectionInput,
  AdminOopSectionPersistResponse,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitAdminOopSection(
  input: AdminOopSectionInput,
): Promise<AdminOopSectionPersistResponse> {
  const response = await apiClient.post<AdminOopSectionPersistResponse>(
    ENDPOINTS.ADMIN.OOP_SECTIONS,
    input,
  );

  return response.data;
}
