import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminPeerEvaluationFormCreateInput = {
  anonymous: boolean;
  closesAt: string;
  milestoneId: number;
  opensAt: string;
};

export type AdminPeerEvaluationFormPersistResponse = {
  id: number;
};

export async function createAdminPeerEvaluationForm(
  sectionId: number,
  input: AdminPeerEvaluationFormCreateInput,
): Promise<AdminPeerEvaluationFormPersistResponse> {
  const response = await apiClient.post<AdminPeerEvaluationFormPersistResponse>(
    ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM(sectionId),
    input,
  );

  return response.data;
}
