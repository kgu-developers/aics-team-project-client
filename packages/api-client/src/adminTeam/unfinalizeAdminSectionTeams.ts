import type {
  AdminSectionTeamsResponse,
  UnfinalizeAdminSectionTeamsInput,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function unfinalizeAdminSectionTeams(
  sectionId: string | number,
  input: UnfinalizeAdminSectionTeamsInput,
): Promise<AdminSectionTeamsResponse> {
  const response = await apiClient.patch<AdminSectionTeamsResponse>(
    ENDPOINTS.ADMIN.SECTION_TEAMS_UNFINALIZE(sectionId),
    input,
  );

  return response.data;
}
