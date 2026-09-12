import { apiClient } from '../client';
import type {
  AdminPeerEvaluationTeamDetailInput,
  AdminPeerEvaluationTeamDetailResponse,
} from './types';
import { ENDPOINTS } from '../constants/endpoints';


export async function fetchAdminPeerEvaluationTeamDetail(
  sectionId: string | number,
  { teamId, ...params }: AdminPeerEvaluationTeamDetailInput,
): Promise<AdminPeerEvaluationTeamDetailResponse> {
  const response = await apiClient.get<AdminPeerEvaluationTeamDetailResponse>(
    ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_TEAM(sectionId, teamId),
    { params },
  );

  return response.data;
}
