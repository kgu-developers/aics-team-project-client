import { apiClient } from '../client';
import type {
  AdminPresentationEvaluationListInput,
  AdminPresentationEvaluationListResponse,
} from './types';
import { ENDPOINTS } from '../constants/endpoints';


export async function fetchAdminPresentationEvaluations(
  sectionId: string | number,
  input: AdminPresentationEvaluationListInput = {},
): Promise<AdminPresentationEvaluationListResponse> {
  const response = await apiClient.get<AdminPresentationEvaluationListResponse>(
    ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATIONS(sectionId),
    { params: input },
  );

  return response.data;
}
