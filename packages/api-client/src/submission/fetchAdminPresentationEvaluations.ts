import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminPresentationEvaluationCriterionDto = {
  id: string;
  label: string;
};
export type AdminPresentationEvaluationTeamDto = {
  submissionId: string;
  teamId: string;
  teamName: string;
  projectTopic: string | null;
  presentationOrder: number | null;
  submittedEvaluatorCount: number;
  evaluatorCount: number;
  criteria: Record<string, number | null>;
};
export type AdminPresentationEvaluationsResponse = {
  section: { id: string; label: string };
  evaluationPeriod: { startsAt: string | null; endsAt: string | null };
  criteria: AdminPresentationEvaluationCriterionDto[];
  teams: AdminPresentationEvaluationTeamDto[];
};

export async function fetchAdminPresentationEvaluations(sectionId: string) {
  const response = await apiClient.get<AdminPresentationEvaluationsResponse>(
    ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS(sectionId),
  );
  return response.data;
}
