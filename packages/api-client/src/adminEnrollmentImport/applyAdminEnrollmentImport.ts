import type { ApplyAdminEnrollmentImportResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function applyAdminEnrollmentImport(
  importId: string | number,
): Promise<ApplyAdminEnrollmentImportResponse> {
  const response = await apiClient.post<ApplyAdminEnrollmentImportResponse>(
    ENDPOINTS.ADMIN.ENROLLMENT_IMPORT_APPLY(importId),
  );

  return response.data;
}
