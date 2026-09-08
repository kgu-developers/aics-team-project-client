import type { AdminEnrollmentImportPreviewResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function previewAdminEnrollmentImport(
  sectionId: string | number,
  file: File,
): Promise<AdminEnrollmentImportPreviewResponse> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await apiClient.post<AdminEnrollmentImportPreviewResponse>(
    ENDPOINTS.ADMIN.SECTION_ENROLLMENT_IMPORT_PREVIEW(sectionId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data;
}
