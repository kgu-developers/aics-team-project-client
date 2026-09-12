import { apiClient } from '../client';
import type {
  AdminPeerEvaluationListInput,
  AdminPeerEvaluationListResponse,
} from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminPeerEvaluations(
  sectionId: string | number,
  input: AdminPeerEvaluationListInput = {},
): Promise<AdminPeerEvaluationListResponse> {
  const response = await apiClient.get<AdminPeerEvaluationListResponse>(
    ENDPOINTS.ADMIN.OOP_PEER_EVALUATIONS(sectionId),
    { params: input },
  );

  return response.data;
}
