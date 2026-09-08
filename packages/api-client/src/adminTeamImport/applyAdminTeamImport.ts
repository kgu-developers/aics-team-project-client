import type { ApplyAdminTeamImportResponse } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function applyAdminTeamImport(
  importId: string | number,
): Promise<ApplyAdminTeamImportResponse> {
  const response = await apiClient.post<ApplyAdminTeamImportResponse>(
    ENDPOINTS.ADMIN.TEAM_IMPORT_APPLY(importId),
  );

  return response.data;
}
