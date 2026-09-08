import type { AdminTeamImportPreviewResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function previewAdminTeamImport(
  sectionId: string | number,
  file: File,
): Promise<AdminTeamImportPreviewResponse> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await apiClient.post<AdminTeamImportPreviewResponse>(
    ENDPOINTS.ADMIN.SECTION_TEAM_IMPORT_PREVIEW(sectionId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data;
}
