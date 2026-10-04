import { apiClient } from '../client';
import type { AdminProfessorPresentationEvaluationDto } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminProfessorPresentationEvaluationInput = {
  memo?: string | null;
  scores: Array<{ criterionId: number; score: number }>;
};

export async function updateAdminProfessorPresentationEvaluation(
  sectionId: string | number,
  milestoneId: string | number,
  teamId: string | number,
  input: AdminProfessorPresentationEvaluationInput,
): Promise<AdminProfessorPresentationEvaluationDto> {
  const response = await apiClient.put<AdminProfessorPresentationEvaluationDto>(
    ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATION_PROFESSOR(
      sectionId,
      milestoneId,
      teamId,
    ),
    input,
  );
  return response.data;
}
