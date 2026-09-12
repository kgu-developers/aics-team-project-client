import { apiClient } from '../client';
import type {
  AdminPresentationEvaluationTeamDetailInput,
  AdminPresentationEvaluationTeamDetailResponse,
} from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminPresentationEvaluationTeamDetail(
  sectionId: string | number,
  { teamId, ...params }: AdminPresentationEvaluationTeamDetailInput,
): Promise<AdminPresentationEvaluationTeamDetailResponse> {
  const response =
    await apiClient.get<AdminPresentationEvaluationTeamDetailResponse>(
      ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATION_TEAM(sectionId, teamId),
      { params },
    );

  return response.data;
}
