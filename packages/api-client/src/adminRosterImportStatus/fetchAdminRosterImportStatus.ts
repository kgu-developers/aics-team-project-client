import { apiClient } from '../client';
import type { AdminRosterImportStatusResponse } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminRosterImportStatus(
  sectionId: string,
): Promise<AdminRosterImportStatusResponse> {
  const response = await apiClient.get<AdminRosterImportStatusResponse>(
    ENDPOINTS.ADMIN.SECTION_ROSTER_IMPORT_STATUS(sectionId),
  );

  return response.data;
}
