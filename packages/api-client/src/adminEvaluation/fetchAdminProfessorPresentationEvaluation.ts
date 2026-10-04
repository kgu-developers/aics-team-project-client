import { apiClient } from '../client';
import type { AdminProfessorPresentationEvaluationDto } from './types';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchAdminProfessorPresentationEvaluation(
  sectionId: string | number,
  milestoneId: string | number,
  teamId: string | number,
): Promise<AdminProfessorPresentationEvaluationDto> {
  const response = await apiClient.get<AdminProfessorPresentationEvaluationDto>(
    ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATION_PROFESSOR(
      sectionId,
      milestoneId,
      teamId,
    ),
  );
  return response.data;
}
