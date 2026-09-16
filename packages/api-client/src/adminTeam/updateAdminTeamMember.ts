import type { AdminTeamMemberDto } from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type UpdateAdminTeamMemberInput = Partial<{
  isLeader: boolean;
  projectRole: string;
  targetTeamId: number;
}>;

export async function updateAdminTeamMember(
  teamId: string | number,
  studentNumber: string,
  input: UpdateAdminTeamMemberInput,
): Promise<AdminTeamMemberDto> {
  const response = await apiClient.patch<AdminTeamMemberDto>(
    ENDPOINTS.ADMIN.TEAM_MEMBER(teamId, studentNumber),
    input,
  );

  return response.data;
}
