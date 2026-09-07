import type {
  TeamMemberContact,
  TeamMemberContactListResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchTeamMemberContacts(
  teamId: string,
): Promise<TeamMemberContact[]> {
  const response = await apiClient.get<TeamMemberContactListResponse>(
    ENDPOINTS.TEAM.MEMBER_CONTACTS(teamId),
  );

  return response.data.contents;
}
